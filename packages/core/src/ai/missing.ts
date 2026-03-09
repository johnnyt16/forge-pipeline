import { prisma } from "../db/client";
import { transitionStatus } from "../pipeline/status";
import { ProjectStatus } from "@prisma/client";

interface MissingField {
  field: string;
  label: string;
  severity: "critical" | "recommended" | "optional";
  reason: string;
}

type FieldCheck = {
  field: string;
  label: string;
  severity: MissingField["severity"];
  check: (data: Record<string, unknown>) => boolean;
  reason: string;
};

/**
 * Insurance-specific field checks — merged when templateFamily is INSURANCE_AGENCY.
 */
const INSURANCE_FIELD_CHECKS: FieldCheck[] = [
  {
    field: "carrierPartners",
    label: "Carrier Partners",
    severity: "recommended",
    check: (d) => !d.carrierPartners || !Array.isArray(d.carrierPartners) || d.carrierPartners.length === 0,
    reason: "No carrier partners found — listing carriers builds trust with insurance shoppers",
  },
  {
    field: "yearsInBusiness",
    label: "Years in Business",
    severity: "recommended",
    check: (d) => !d.yearsInBusiness,
    reason: "No years in business found — longevity builds credibility for insurance agencies",
  },
  {
    field: "certifications",
    label: "Agent Certifications",
    severity: "optional",
    check: (d) => !d.certifications || !Array.isArray(d.certifications) || d.certifications.length === 0,
    reason: "No agent certifications found (CPCU, CIC, CISR, etc.)",
  },
];

/**
 * Normalize template family to the canonical UPPER_SNAKE format.
 */
function normalizeTemplateFamily(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.toUpperCase().replace(/-/g, "_");
}

/**
 * Required fields and their check logic.
 * This is explicit code-based detection — not LLM-dependent.
 */
const FIELD_CHECKS: FieldCheck[] = [
  {
    field: "phone",
    label: "Phone Number",
    severity: "critical",
    check: (d) => !d.phone,
    reason: "No phone number found — essential for a service business",
  },
  {
    field: "email",
    label: "Email Address",
    severity: "critical",
    check: (d) => !d.email,
    reason: "No email address found",
  },
  {
    field: "address",
    label: "Business Address",
    severity: "critical",
    check: (d) => !d.address,
    reason: "No physical address found — important for local businesses",
  },
  {
    field: "businessDescription",
    label: "Business Description",
    severity: "critical",
    check: (d) => !d.businessDescription || (d.businessDescription as string).length < 20,
    reason: "No business description or too short",
  },
  {
    field: "servicesOffered",
    label: "Services List",
    severity: "critical",
    check: (d) => !d.servicesOffered || !Array.isArray(d.servicesOffered) || d.servicesOffered.length === 0,
    reason: "No services listed — core content for a service business website",
  },
  {
    field: "logoUrl",
    label: "Logo",
    severity: "recommended",
    check: (d) => !d.logoUrl,
    reason: "No logo detected — will need to be provided",
  },
  {
    field: "testimonials",
    label: "Testimonials",
    severity: "recommended",
    check: (d) => !d.testimonials || !Array.isArray(d.testimonials) || d.testimonials.length === 0,
    reason: "No testimonials found — highly recommended for trust",
  },
  {
    field: "officeHours",
    label: "Office Hours",
    severity: "recommended",
    check: (d) => !d.officeHours,
    reason: "No office hours found",
  },
  {
    field: "teamMembers",
    label: "Team Members",
    severity: "optional",
    check: (d) => !d.teamMembers || !Array.isArray(d.teamMembers) || d.teamMembers.length === 0,
    reason: "No team member info found",
  },
  {
    field: "locationsServed",
    label: "Service Areas",
    severity: "optional",
    check: (d) => !d.locationsServed || !Array.isArray(d.locationsServed) || d.locationsServed.length === 0,
    reason: "No service areas listed",
  },
];

/**
 * Detect missing or incomplete fields from extracted data.
 * Uses explicit business rules — not LLM.
 * Merges insurance-specific checks when templateFamily is INSURANCE_AGENCY.
 */
export async function detectMissingInfo(projectId: string): Promise<MissingField[]> {
  const [projectData, project] = await Promise.all([
    prisma.projectData.findUnique({ where: { projectId } }),
    prisma.project.findUniqueOrThrow({
      where: { id: projectId },
      include: { site: true },
    }),
  ]);

  if (!projectData?.extractedJson) {
    throw new Error("No extracted data found. Run extraction first.");
  }

  const data = projectData.extractedJson as Record<string, unknown>;
  const templateFamily = normalizeTemplateFamily(project.site?.templateFamily);

  // Merge insurance checks when applicable
  const checks = templateFamily === "INSURANCE_AGENCY"
    ? [...FIELD_CHECKS, ...INSURANCE_FIELD_CHECKS]
    : FIELD_CHECKS;

  const missing: MissingField[] = [];

  for (const check of checks) {
    if (check.check(data)) {
      missing.push({
        field: check.field,
        label: check.label,
        severity: check.severity,
        reason: check.reason,
      });
    }
  }

  // Save missing fields
  await prisma.projectData.update({
    where: { projectId },
    data: { missingFieldsJson: missing as any },
  });

  // Transition status based on whether critical fields are missing
  const hasCriticalMissing = missing.some((m) => m.severity === "critical");
  if (hasCriticalMissing) {
    await transitionStatus(projectId, ProjectStatus.WAITING_FOR_MISSING_INFO);
  } else {
    await transitionStatus(projectId, ProjectStatus.READY_TO_GENERATE);
  }

  return missing;
}
