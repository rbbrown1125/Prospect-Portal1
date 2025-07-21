import { db } from "./db";
import { templates } from "@shared/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sampleTemplates = [
  {
    name: "Secure Document Portal",
    description: "Professional portal for sharing confidential documents and files with prospects",
    category: "File Sharing",
    thumbnail: "/images/document-portal.jpg",
    content: {
      sections: [
        { 
          type: "hero", 
          title: "Welcome {{prospect_name}}", 
          subtitle: "Your secure document portal is ready. Access your personalized materials below." 
        },
        { 
          type: "overview", 
          title: "About This Portal", 
          content: "Hi {{prospect_name}}, we've prepared these exclusive materials specifically for {{company_name}}. All documents are confidential and tailored to your business needs." 
        },
        { 
          type: "file_section", 
          title: "Your Documents", 
          content: "Click any document below to view or download. All files are virus-scanned and secure.",
          files: [
            { name: "{{proposal_doc}}", type: "PDF", size: "2.4 MB", description: "Custom proposal for {{company_name}}" },
            { name: "{{case_study}}", type: "PDF", size: "1.8 MB", description: "Relevant case study and ROI analysis" },
            { name: "{{pricing_sheet}}", type: "Excel", size: "1.2 MB", description: "Detailed pricing breakdown" }
          ]
        },
        { 
          type: "contact", 
          title: "Questions?", 
          content: "{{contact_name}} is your dedicated contact. Reach out anytime at {{contact_email}} or {{contact_phone}}." 
        }
      ]
    }
  },
  {
    name: "Proposal Package",
    description: "Comprehensive proposal delivery with supporting documents and media files",
    category: "File Sharing",
    thumbnail: "/images/proposal-package.jpg",
    content: {
      sections: [
        { 
          type: "cover", 
          title: "Proposal for {{company_name}}", 
          subtitle: "Prepared exclusively for {{prospect_name}} and the {{company_name}} team" 
        },
        { 
          type: "introduction", 
          title: "Dear {{prospect_name}}", 
          content: "Thank you for considering our partnership. We've crafted this proposal specifically for {{company_name}}'s unique requirements and goals." 
        },
        { 
          type: "file_gallery", 
          title: "Proposal Materials", 
          content: "Your complete proposal package includes detailed documentation, reference materials, and multimedia presentations.",
          files: [
            { name: "{{main_proposal}}", type: "PDF", size: "3.2 MB", description: "Complete business proposal" },
            { name: "{{technical_specs}}", type: "PDF", size: "2.1 MB", description: "Technical specifications" },
            { name: "{{video_presentation}}", type: "MP4", size: "45 MB", description: "Executive summary video" },
            { name: "{{implementation_plan}}", type: "PDF", size: "1.9 MB", description: "Implementation timeline" }
          ]
        },
        { 
          type: "next_steps", 
          title: "Next Steps", 
          content: "Ready to move forward? Contact {{contact_name}} at {{contact_email}} to schedule your implementation call." 
        }
      ]
    }
  },
  {
    name: "Client Resource Library",
    description: "Organized file repository for ongoing client document sharing and updates",
    category: "File Sharing",
    thumbnail: "/images/resource-library.jpg",
    content: {
      sections: [
        { 
          type: "header", 
          title: "{{company_name}} Resource Center", 
          subtitle: "Your dedicated resource library, updated regularly with the latest materials" 
        },
        { 
          type: "welcome", 
          title: "Welcome {{prospect_name}}", 
          content: "This secure portal contains all resources, updates, and documentation for {{company_name}}. Bookmark this page for easy access." 
        },
        { 
          type: "file_categories", 
          title: "Document Categories", 
          content: "Browse by category or use the search function to find specific documents.",
          categories: [
            {
              name: "Getting Started",
              files: [
                { name: "{{onboarding_guide}}", type: "PDF", description: "Complete onboarding checklist" },
                { name: "{{quick_start}}", type: "PDF", description: "Quick start guide" }
              ]
            },
            {
              name: "Training Materials", 
              files: [
                { name: "{{training_video}}", type: "MP4", description: "Comprehensive training session" },
                { name: "{{user_manual}}", type: "PDF", description: "Detailed user manual" }
              ]
            },
            {
              name: "Reports & Analytics",
              files: [
                { name: "{{monthly_report}}", type: "PDF", description: "Latest monthly report" },
                { name: "{{analytics_dashboard}}", type: "Excel", description: "Interactive analytics" }
              ]
            }
          ]
        },
        { 
          type: "support", 
          title: "Support & Contact", 
          content: "Need help? Your account manager {{contact_name}} is available at {{contact_email}} or {{contact_phone}}." 
        }
      ]
    }
  },
  {
    name: "Project Deliverables",
    description: "Professional delivery of completed project files and documentation",
    category: "File Sharing",
    thumbnail: "/images/project-delivery.jpg",
    content: {
      sections: [
        { 
          type: "hero", 
          title: "Project Complete!", 
          subtitle: "{{project_name}} deliverables for {{company_name}} are ready for review" 
        },
        { 
          type: "project_summary", 
          title: "Project Summary", 
          content: "Dear {{prospect_name}}, we're excited to deliver the completed {{project_name}} project. All files have been thoroughly tested and are ready for implementation." 
        },
        { 
          type: "deliverables", 
          title: "Final Deliverables", 
          content: "Download your complete project files below. Each deliverable includes documentation and implementation notes.",
          files: [
            { name: "{{final_design}}", type: "ZIP", size: "12.5 MB", description: "Complete design files and assets" },
            { name: "{{source_code}}", type: "ZIP", size: "8.3 MB", description: "Source code with documentation" },
            { name: "{{user_guide}}", type: "PDF", size: "2.1 MB", description: "End user documentation" },
            { name: "{{deployment_guide}}", type: "PDF", size: "1.8 MB", description: "Deployment instructions" }
          ]
        },
        { 
          type: "warranty", 
          title: "Support & Warranty", 
          content: "Your project includes {{warranty_period}} of support. Contact {{support_email}} for any questions or assistance." 
        }
      ]
    }
  },
  {
    name: "Secure File Exchange",
    description: "High-security file sharing for sensitive documents and confidential materials",
    category: "File Sharing",
    thumbnail: "/images/secure-exchange.jpg",
    content: {
      sections: [
        { 
          type: "security_header", 
          title: "Secure Access for {{prospect_name}}", 
          subtitle: "This portal uses bank-level encryption to protect your confidential documents" 
        },
        { 
          type: "security_notice", 
          title: "Security Information", 
          content: "Welcome {{prospect_name}}. This secure portal was created specifically for {{company_name}}. All files are encrypted in transit and at rest." 
        },
        { 
          type: "secure_files", 
          title: "Confidential Documents", 
          content: "Access your secure files below. Download links expire after {{expiry_days}} days for security.",
          files: [
            { name: "{{contract_draft}}", type: "PDF", size: "2.8 MB", description: "Confidential contract draft", security: "encrypted" },
            { name: "{{financial_proposal}}", type: "Excel", size: "1.5 MB", description: "Detailed financial analysis", security: "encrypted" },
            { name: "{{nda_document}}", type: "PDF", size: "890 KB", description: "Non-disclosure agreement", security: "encrypted" }
          ]
        },
        { 
          type: "security_footer", 
          title: "Security Notice", 
          content: "This portal automatically logs access attempts. For security questions, contact {{security_contact}} immediately." 
        }
      ]
    }
  },
  {
    name: "Media Package Delivery",
    description: "Professional delivery of large media files, videos, and creative assets",
    category: "File Sharing",
    thumbnail: "/images/media-delivery.jpg",
    content: {
      sections: [
        { 
          type: "cover", 
          title: "Media Package for {{company_name}}", 
          subtitle: "Your complete media assets are ready for download, {{prospect_name}}" 
        },
        { 
          type: "package_info", 
          title: "Package Contents", 
          content: "Hi {{prospect_name}}, your custom media package includes high-resolution assets, videos, and supporting materials for {{company_name}}." 
        },
        { 
          type: "media_files", 
          title: "Download Your Files", 
          content: "All files are available in multiple formats. Choose the version that best suits your needs.",
          files: [
            { name: "{{brand_video}}", type: "MP4", size: "156 MB", description: "4K brand video with audio" },
            { name: "{{product_photos}}", type: "ZIP", size: "89 MB", description: "High-res product photography" },
            { name: "{{logo_package}}", type: "ZIP", size: "12 MB", description: "Logos in all formats (PNG, SVG, EPS)" },
            { name: "{{brand_guidelines}}", type: "PDF", size: "5.2 MB", description: "Complete brand guidelines" }
          ]
        },
        { 
          type: "usage_rights", 
          title: "Usage Rights", 
          content: "All media files are licensed for {{usage_scope}} use by {{company_name}}. See license agreement for full terms." 
        },
        { 
          type: "technical_support", 
          title: "Technical Support", 
          content: "Need help with file formats or have technical questions? Contact {{tech_support}} for assistance." 
        }
      ]
    }
  }
];

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.log(`Database operation failed, retrying... (${retries} attempts remaining)`);
      await delay(RETRY_DELAY);
      return executeWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

export async function seedTemplates() {
  try {
    console.log("Checking for existing templates...");
    
    const existingTemplates = await executeWithRetry(() => 
      db.select().from(templates)
    );
    
    if (existingTemplates.length > 0) {
      console.log("Templates already exist, skipping seed");
      return;
    }
    
    console.log("Seeding templates...");
    for (const template of sampleTemplates) {
      await executeWithRetry(() => 
        db.insert(templates).values(template)
      );
    }
    
    console.log("Templates seeded successfully!");
  } catch (error) {
    console.error("Error seeding templates:", error);
    // Don't throw here - allow the app to continue running even if seeding fails
  }
}