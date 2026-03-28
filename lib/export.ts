/**
 * HireWire Document Export Library
 * 
 * Exports structured documents to DOCX and PDF formats
 * Uses docx for Word documents and puppeteer-core for PDF
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  convertInchesToTwip,
  SectionType,
} from "docx"
import {
  StructuredResume,
  StructuredCoverLetter,
  ExportFormat,
  ExportResult,
} from "./document-types"

// ============================================================================
// DOCX EXPORT - RESUME
// ============================================================================

export async function exportResumeToDocx(resume: StructuredResume): Promise<ExportResult> {
  try {
    const children: Paragraph[] = []
    
    // Header - Name
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: resume.basics.name.toUpperCase(),
            bold: true,
            size: 28, // 14pt
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      })
    )
    
    // Header - Contact info
    const contactParts = [
      resume.basics.location,
      resume.basics.email,
      resume.basics.phone,
    ].filter(Boolean)
    
    if (contactParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: contactParts.join(" | "),
              size: 20, // 10pt
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        })
      )
    }
    
    // Links row
    const linkParts = [
      resume.basics.linkedinUrl,
      resume.basics.githubUrl,
      resume.basics.portfolioUrl,
    ].filter(Boolean)
    
    if (linkParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: linkParts.join(" | "),
              size: 18, // 9pt
              color: "0000EE",
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        })
      )
    }
    
    // Summary Section
    if (resume.summary) {
      children.push(createSectionHeading("PROFESSIONAL SUMMARY"))
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: resume.summary,
              size: 22, // 11pt
            }),
          ],
          spacing: { after: 200 },
        })
      )
    }
    
    // Skills Section (for technical resumes)
    if (resume.skills.length > 0) {
      children.push(createSectionHeading("TECHNICAL SKILLS"))
      
      for (const group of resume.skills) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${group.category}: `,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: group.skills.join(", "),
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      }
      children.push(new Paragraph({ spacing: { after: 100 } }))
    }
    
    // Experience Section
    if (resume.experience.length > 0) {
      children.push(createSectionHeading("PROFESSIONAL EXPERIENCE"))
      
      for (const exp of resume.experience) {
        // Title and Company
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: exp.title,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` | ${exp.company}`,
                size: 22,
              }),
              new TextRun({
                text: exp.location ? ` | ${exp.location}` : "",
                size: 22,
              }),
            ],
            spacing: { after: 50 },
          })
        )
        
        // Date range
        const dateText = exp.isCurrent 
          ? `${exp.startDate} - Present`
          : `${exp.startDate} - ${exp.endDate || ""}`
        
        if (exp.startDate) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: dateText,
                  italics: true,
                  size: 20,
                }),
              ],
              spacing: { after: 100 },
            })
          )
        }
        
        // Bullets
        for (const bullet of exp.bullets) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${bullet.text}`,
                  size: 22,
                }),
              ],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 50 },
            })
          )
        }
        
        children.push(new Paragraph({ spacing: { after: 150 } }))
      }
    }
    
    // Projects Section
    if (resume.projects && resume.projects.length > 0) {
      children.push(createSectionHeading("PROJECTS"))
      
      for (const project of resume.projects) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: project.title,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` | ${project.techStack.join(", ")}`,
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        )
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${project.description}`,
                size: 22,
              }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 50 },
          })
        )
        
        if (project.impact) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `• Impact: ${project.impact}`,
                  size: 22,
                }),
              ],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 100 },
            })
          )
        }
      }
    }
    
    // Education Section
    if (resume.education.length > 0) {
      children.push(createSectionHeading("EDUCATION"))
      
      for (const edu of resume.education) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: edu.degree,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` | ${edu.school}`,
                size: 22,
              }),
              new TextRun({
                text: edu.graduationYear ? ` | ${edu.graduationYear}` : "",
                size: 22,
              }),
            ],
            spacing: { after: 100 },
          })
        )
      }
    }
    
    // Certifications Section
    if (resume.certifications && resume.certifications.length > 0) {
      children.push(createSectionHeading("CERTIFICATIONS"))
      
      for (const cert of resume.certifications) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${cert.name}`,
                size: 22,
              }),
              new TextRun({
                text: ` - ${cert.issuer}`,
                size: 20,
              }),
              new TextRun({
                text: cert.dateObtained ? ` (${cert.dateObtained})` : "",
                size: 20,
              }),
            ],
            spacing: { after: 50 },
          })
        )
      }
    }
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        children,
      }],
    })
    
    const buffer = await Packer.toBuffer(doc)
    
    return {
      success: true,
      format: "docx",
      filename: `${resume.basics.name.replace(/\s+/g, "_")}_Resume.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      data: buffer,
    }
  } catch (error) {
    return {
      success: false,
      format: "docx",
      filename: "",
      mimeType: "",
      data: Buffer.from(""),
      error: error instanceof Error ? error.message : "Failed to generate DOCX",
    }
  }
}

// ============================================================================
// DOCX EXPORT - COVER LETTER
// ============================================================================

export async function exportCoverLetterToDocx(letter: StructuredCoverLetter, senderName: string): Promise<ExportResult> {
  try {
    const children: Paragraph[] = []
    
    // Date
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: new Date().toLocaleDateString("en-US", { 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            }),
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      })
    )
    
    // Recipient
    if (letter.recipient.name) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: letter.recipient.name, size: 22 }),
          ],
        })
      )
    }
    if (letter.recipient.title) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: letter.recipient.title, size: 22 }),
          ],
        })
      )
    }
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: letter.recipient.company, size: 22 }),
        ],
        spacing: { after: 300 },
      })
    )
    
    // Greeting
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: letter.opening.greeting, size: 22 }),
        ],
        spacing: { after: 200 },
      })
    )
    
    // Opening paragraph
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: letter.opening.hookParagraph, size: 22 }),
        ],
        spacing: { after: 200 },
      })
    )
    
    // Body sections
    for (const section of letter.bodySections) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: section.paragraphText, size: 22 }),
          ],
          spacing: { after: 200 },
        })
      )
    }
    
    // Closing
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: letter.closing.callToAction, size: 22 }),
        ],
        spacing: { after: 300 },
      })
    )
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: letter.closing.signoff, size: 22 }),
        ],
        spacing: { after: 100 },
      })
    )
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: senderName || letter.closing.senderName, size: 22 }),
        ],
      })
    )
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      }],
    })
    
    const buffer = await Packer.toBuffer(doc)
    
    return {
      success: true,
      format: "docx",
      filename: `${senderName.replace(/\s+/g, "_")}_Cover_Letter_${letter.recipient.company.replace(/\s+/g, "_")}.docx`,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      data: buffer,
    }
  } catch (error) {
    return {
      success: false,
      format: "docx",
      filename: "",
      mimeType: "",
      data: Buffer.from(""),
      error: error instanceof Error ? error.message : "Failed to generate DOCX",
    }
  }
}

// ============================================================================
// HTML EXPORT (for PDF conversion)
// ============================================================================

export function exportResumeToHtml(resume: StructuredResume): string {
  const skillsHtml = resume.skills.map(group => 
    `<p><strong>${group.category}:</strong> ${group.skills.join(", ")}</p>`
  ).join("")
  
  const experienceHtml = resume.experience.map(exp => `
    <div class="experience-entry">
      <div class="exp-header">
        <strong>${exp.title}</strong> | ${exp.company}${exp.location ? ` | ${exp.location}` : ""}
      </div>
      ${exp.startDate ? `<div class="exp-dates">${exp.startDate} - ${exp.isCurrent ? "Present" : exp.endDate || ""}</div>` : ""}
      <ul>
        ${exp.bullets.map(b => `<li>${b.text}</li>`).join("")}
      </ul>
    </div>
  `).join("")
  
  const educationHtml = resume.education.map(edu => 
    `<p><strong>${edu.degree}</strong> | ${edu.school}${edu.graduationYear ? ` | ${edu.graduationYear}` : ""}</p>`
  ).join("")
  
  const projectsHtml = resume.projects?.map(p => `
    <div class="project-entry">
      <strong>${p.title}</strong> | ${p.techStack.join(", ")}
      <ul>
        <li>${p.description}</li>
        ${p.impact ? `<li>Impact: ${p.impact}</li>` : ""}
      </ul>
    </div>
  `).join("") || ""
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.75in;
    }
    h1 {
      text-align: center;
      font-size: 14pt;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .contact {
      text-align: center;
      font-size: 10pt;
      margin-bottom: 15px;
    }
    h2 {
      font-size: 11pt;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-top: 15px;
      margin-bottom: 10px;
    }
    .experience-entry {
      margin-bottom: 12px;
    }
    .exp-header {
      margin-bottom: 3px;
    }
    .exp-dates {
      font-style: italic;
      font-size: 10pt;
      margin-bottom: 5px;
    }
    ul {
      margin: 5px 0;
      padding-left: 20px;
    }
    li {
      margin-bottom: 3px;
    }
    .project-entry {
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>${resume.basics.name}</h1>
  <div class="contact">
    ${[resume.basics.location, resume.basics.email, resume.basics.phone].filter(Boolean).join(" | ")}
  </div>
  
  ${resume.summary ? `
  <h2>Professional Summary</h2>
  <p>${resume.summary}</p>
  ` : ""}
  
  ${resume.skills.length > 0 ? `
  <h2>Technical Skills</h2>
  ${skillsHtml}
  ` : ""}
  
  ${resume.experience.length > 0 ? `
  <h2>Professional Experience</h2>
  ${experienceHtml}
  ` : ""}
  
  ${resume.projects && resume.projects.length > 0 ? `
  <h2>Projects</h2>
  ${projectsHtml}
  ` : ""}
  
  ${resume.education.length > 0 ? `
  <h2>Education</h2>
  ${educationHtml}
  ` : ""}
</body>
</html>`
}

export function exportCoverLetterToHtml(letter: StructuredCoverLetter, senderName: string): string {
  const bodySectionsHtml = letter.bodySections
    .map(s => `<p>${s.paragraphText}</p>`)
    .join("")
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 1in;
    }
    .date {
      margin-bottom: 20px;
    }
    .recipient {
      margin-bottom: 20px;
    }
    p {
      margin-bottom: 15px;
    }
    .signoff {
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="date">
    ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
  </div>
  
  <div class="recipient">
    ${letter.recipient.name ? `<div>${letter.recipient.name}</div>` : ""}
    ${letter.recipient.title ? `<div>${letter.recipient.title}</div>` : ""}
    <div>${letter.recipient.company}</div>
  </div>
  
  <p>${letter.opening.greeting}</p>
  
  <p>${letter.opening.hookParagraph}</p>
  
  ${bodySectionsHtml}
  
  <p>${letter.closing.callToAction}</p>
  
  <div class="signoff">
    <p>${letter.closing.signoff}</p>
    <p>${senderName || letter.closing.senderName}</p>
  </div>
</body>
</html>`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createSectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 22, // 11pt
        allCaps: true,
      }),
    ],
    border: {
      bottom: {
        color: "000000",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    spacing: { before: 200, after: 100 },
  })
}

// ============================================================================
// FILE NAMING
// ============================================================================

export function generateFilename(
  candidateName: string,
  company: string,
  role: string,
  documentType: "resume" | "cover_letter",
  format: ExportFormat
): string {
  const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_")
  const name = sanitize(candidateName)
  const comp = sanitize(company)
  const roleShort = sanitize(role).slice(0, 30)
  const docType = documentType === "resume" ? "Resume" : "CoverLetter"
  
  return `${name}_${comp}_${roleShort}_${docType}.${format}`
}
