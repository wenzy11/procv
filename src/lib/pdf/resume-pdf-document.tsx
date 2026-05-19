import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { ResumeDocument, ResumeTemplateId } from "@/lib/types";
import { formatResumeDate } from "@/lib/i18n/dates";
import { normalizeTemplateId } from "@/lib/templates";
import type { Locale } from "@/lib/i18n";

const base = {
  fontFamily: "NotoSans" as const,
  color: "#1f2937",
};

const styles = StyleSheet.create({
  pageClassic: {
    ...base,
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  pageModern: {
    ...base,
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 0,
    fontSize: 10,
    backgroundColor: "#f8faff",
  },
  pageMinimal: {
    ...base,
    paddingTop: 44,
    paddingBottom: 44,
    paddingHorizontal: 48,
    fontSize: 10.5,
    backgroundColor: "#ffffff",
  },
  headerClassic: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerModern: {
    backgroundColor: "#4338ca",
    paddingVertical: 28,
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  headerMinimal: {
    marginBottom: 28,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#111827",
  },
  nameClassic: { fontSize: 24, fontWeight: 700, color: "#111827", fontFamily: "NotoSans" },
  nameModern: { fontSize: 26, fontWeight: 700, color: "#ffffff", fontFamily: "NotoSans" },
  nameMinimal: { fontSize: 28, fontWeight: 700, color: "#111827", fontFamily: "NotoSans" },
  headlineClassic: { fontSize: 11, fontWeight: 700, color: "#4338ca", marginTop: 4, fontFamily: "NotoSans" },
  headlineModern: { fontSize: 12, fontWeight: 700, color: "#c7d2fe", marginTop: 6, fontFamily: "NotoSans" },
  headlineMinimal: { fontSize: 12, color: "#6b7280", marginTop: 8, fontFamily: "NotoSans" },
  contactClassic: { fontSize: 9, color: "#4b5563", marginTop: 8, fontFamily: "NotoSans" },
  contactModern: { fontSize: 9, color: "#e0e7ff", marginTop: 10, fontFamily: "NotoSans" },
  contactMinimal: { fontSize: 9, color: "#6b7280", marginTop: 10, fontFamily: "NotoSans" },
  bodyPad: { paddingHorizontal: 40 },
  columns: { flexDirection: "row", gap: 22 },
  main: { flex: 2 },
  sidebarClassic: {
    flex: 1,
    paddingLeft: 14,
    borderLeftWidth: 1,
    borderLeftColor: "#e5e7eb",
  },
  sidebarModern: {
    flex: 1,
    backgroundColor: "#eef2ff",
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  sectionTitle: {
    fontSize: 8.5,
    fontWeight: 700,
    color: "#4338ca",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 12,
    fontFamily: "NotoSans",
  },
  sectionTitleModern: { color: "#3730a3" },
  sectionTitleMinimal: {
    fontSize: 9,
    color: "#111827",
    letterSpacing: 2,
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  sectionTitleFirst: { marginTop: 0 },
  rowTitle: { fontSize: 11, fontWeight: 700, color: "#111827", fontFamily: "NotoSans" },
  rowMeta: { fontSize: 9, color: "#6b7280", marginTop: 2, fontFamily: "NotoSans" },
  body: { fontSize: 10, lineHeight: 1.5, color: "#374151", marginTop: 4, fontFamily: "NotoSans" },
  bullet: {
    fontSize: 10,
    lineHeight: 1.45,
    color: "#374151",
    marginLeft: 10,
    marginTop: 3,
    fontFamily: "NotoSans",
  },
  skillChip: { fontSize: 9, color: "#374151", marginBottom: 3, fontFamily: "NotoSans" },
  expBlock: { marginBottom: 10 },
  projBlock: { marginBottom: 8 },
  minimalSection: { marginBottom: 14 },
});

export interface ResumePdfLabels {
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  languages: string;
  education: string;
  present: string;
  stack: string;
}

interface Props {
  resume: Omit<ResumeDocument, "id" | "updatedAt">;
  locale: Locale;
  labels: ResumePdfLabels;
}

function SectionTitle({
  children,
  first,
  variant,
}: {
  children: string;
  first?: boolean;
  variant: ResumeTemplateId;
}) {
  return (
    <Text
      style={[
        styles.sectionTitle,
        first ? styles.sectionTitleFirst : {},
        variant === "modern" ? styles.sectionTitleModern : {},
        variant === "minimal" ? styles.sectionTitleMinimal : {},
      ]}
    >
      {children}
    </Text>
  );
}

type ContentProps = {
  resume: Omit<ResumeDocument, "id" | "updatedAt">;
  locale: Locale;
  labels: ResumePdfLabels;
  template: ResumeTemplateId;
};

function ResumeMainColumn({ resume, locale, labels, template }: ContentProps) {
  const p = resume.personal;
  const fmt = (v: string) => formatResumeDate(v, locale, labels.present);

  return (
    <>
      {p.summary ? (
        <View>
          <SectionTitle first variant={template}>
            {labels.summary}
          </SectionTitle>
          <Text style={styles.body}>{p.summary}</Text>
        </View>
      ) : null}

      {resume.experience.length > 0 ? (
        <View>
          <SectionTitle first={!p.summary} variant={template}>
            {labels.experience}
          </SectionTitle>
          {resume.experience.map((exp) => (
            <View key={exp.id} style={styles.expBlock} wrap={false}>
              <Text style={styles.rowTitle}>{exp.role || "—"}</Text>
              <Text style={styles.rowMeta}>
                {exp.company}
                {exp.location ? ` · ${exp.location}` : ""}
                {(exp.startDate || exp.endDate) &&
                  ` · ${fmt(exp.startDate)} – ${fmt(exp.endDate)}`}
              </Text>
              {exp.description ? (
                <Text style={styles.body}>{exp.description}</Text>
              ) : null}
              {exp.highlights
                .filter((h) => h.trim())
                .map((h, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {h}
                  </Text>
                ))}
            </View>
          ))}
        </View>
      ) : null}

      {resume.projects.length > 0 ? (
        <View>
          <SectionTitle variant={template}>{labels.projects}</SectionTitle>
          {resume.projects.map((proj) => (
            <View key={proj.id} style={styles.projBlock}>
              <Text style={styles.rowTitle}>{proj.name || "—"}</Text>
              {proj.description ? (
                <Text style={styles.body}>{proj.description}</Text>
              ) : null}
              {proj.stack.length > 0 ? (
                <Text style={styles.rowMeta}>
                  {labels.stack}: {proj.stack.join(" · ")}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function ResumeSidebarColumn({ resume, locale, labels, template }: ContentProps) {
  const fmt = (v: string) => formatResumeDate(v, locale, labels.present);

  return (
    <>
      {resume.skills.length > 0 ? (
        <View>
          <SectionTitle first variant={template}>
            {labels.skills}
          </SectionTitle>
          {resume.skills.map((s) => (
            <Text key={s.id} style={styles.skillChip}>
              • {s.name}
            </Text>
          ))}
        </View>
      ) : null}

      {resume.languages.length > 0 ? (
        <View>
          <SectionTitle variant={template}>{labels.languages}</SectionTitle>
          {resume.languages.map((l) => (
            <Text key={l.id} style={styles.skillChip}>
              {l.name} — {l.proficiency}
            </Text>
          ))}
        </View>
      ) : null}

      {resume.education.length > 0 ? (
        <View>
          <SectionTitle variant={template}>{labels.education}</SectionTitle>
          {resume.education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 8 }}>
              <Text style={styles.rowTitle}>{edu.school || "—"}</Text>
              <Text style={styles.rowMeta}>
                {[edu.degree, edu.field].filter(Boolean).join(", ")}
              </Text>
              {edu.startDate || edu.endDate ? (
                <Text style={styles.rowMeta}>
                  {fmt(edu.startDate)} – {fmt(edu.endDate)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function ClassicPdfPage({ resume, locale, labels }: ContentProps) {
  const p = resume.personal;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github]
    .filter(Boolean)
    .join(" · ");
  const content = { resume, locale, labels, template: "classic" as const };

  return (
    <Page size="A4" style={styles.pageClassic}>
      <View style={styles.headerClassic}>
        <Text style={styles.nameClassic}>{p.fullName || "—"}</Text>
        {p.headline ? (
          <Text style={styles.headlineClassic}>{p.headline}</Text>
        ) : null}
        {contact ? <Text style={styles.contactClassic}>{contact}</Text> : null}
      </View>
      <View style={styles.columns}>
        <View style={styles.main}>
          <ResumeMainColumn {...content} />
        </View>
        <View style={styles.sidebarClassic}>
          <ResumeSidebarColumn {...content} />
        </View>
      </View>
    </Page>
  );
}

function ModernPdfPage({ resume, locale, labels }: ContentProps) {
  const p = resume.personal;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github]
    .filter(Boolean)
    .join(" · ");
  const content = { resume, locale, labels, template: "modern" as const };

  return (
    <Page size="A4" style={styles.pageModern}>
      <View style={styles.headerModern}>
        <Text style={styles.nameModern}>{p.fullName || "—"}</Text>
        {p.headline ? (
          <Text style={styles.headlineModern}>{p.headline}</Text>
        ) : null}
        {contact ? <Text style={styles.contactModern}>{contact}</Text> : null}
      </View>
      <View style={styles.bodyPad}>
        <View style={styles.columns}>
          <View style={styles.main}>
            <ResumeMainColumn {...content} />
          </View>
          <View style={styles.sidebarModern}>
            <ResumeSidebarColumn {...content} />
          </View>
        </View>
      </View>
    </Page>
  );
}

function MinimalPdfPage({ resume, locale, labels }: ContentProps) {
  const p = resume.personal;
  const contact = [p.email, p.phone, p.location, p.website, p.linkedin, p.github]
    .filter(Boolean)
    .join(" · ");
  const fmt = (v: string) => formatResumeDate(v, locale, labels.present);
  const template = "minimal" as const;

  return (
    <Page size="A4" style={styles.pageMinimal}>
      <View style={styles.headerMinimal}>
        <Text style={styles.nameMinimal}>{p.fullName || "—"}</Text>
        {p.headline ? (
          <Text style={styles.headlineMinimal}>{p.headline}</Text>
        ) : null}
        {contact ? <Text style={styles.contactMinimal}>{contact}</Text> : null}
      </View>

      {p.summary ? (
        <View style={styles.minimalSection}>
          <SectionTitle first variant={template}>
            {labels.summary}
          </SectionTitle>
          <Text style={styles.body}>{p.summary}</Text>
        </View>
      ) : null}

      {resume.experience.length > 0 ? (
        <View style={styles.minimalSection}>
          <SectionTitle first={!p.summary} variant={template}>
            {labels.experience}
          </SectionTitle>
          {resume.experience.map((exp) => (
            <View key={exp.id} style={styles.expBlock}>
              <Text style={styles.rowTitle}>{exp.role}</Text>
              <Text style={styles.rowMeta}>
                {exp.company} · {fmt(exp.startDate)} – {fmt(exp.endDate)}
              </Text>
              {exp.highlights
                .filter((h) => h.trim())
                .map((h, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {h}
                  </Text>
                ))}
            </View>
          ))}
        </View>
      ) : null}

      {resume.skills.length > 0 ? (
        <View style={styles.minimalSection}>
          <SectionTitle variant={template}>{labels.skills}</SectionTitle>
          <Text style={styles.body}>
            {resume.skills.map((s) => s.name).join(" · ")}
          </Text>
        </View>
      ) : null}

      {resume.education.length > 0 ? (
        <View style={styles.minimalSection}>
          <SectionTitle variant={template}>{labels.education}</SectionTitle>
          {resume.education.map((edu) => (
            <View key={edu.id} style={{ marginBottom: 6 }}>
              <Text style={styles.rowTitle}>{edu.school}</Text>
              <Text style={styles.rowMeta}>
                {[edu.degree, edu.field].filter(Boolean).join(", ")}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Page>
  );
}

export function ResumePdfDocument({ resume, locale, labels }: Props) {
  const template = normalizeTemplateId(resume.templateId);
  const props = { resume, locale, labels, template };

  return (
    <Document>
      {template === "modern" ? (
        <ModernPdfPage {...props} />
      ) : template === "minimal" ? (
        <MinimalPdfPage {...props} />
      ) : (
        <ClassicPdfPage {...props} />
      )}
    </Document>
  );
}
