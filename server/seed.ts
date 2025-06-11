import { db } from "./db";
import { templates } from "@shared/schema";

const sampleTemplates = [
  {
    name: "Sales Pitch Deck",
    description: "Professional presentation template for sales pitches and product demos",
    category: "Sales",
    thumbnail: "/images/sales-template.jpg",
    content: {
      sections: [
        { type: "hero", title: "Welcome to {{company}}", subtitle: "{{tagline}}" },
        { type: "problem", title: "The Challenge", content: "{{problem_statement}}" },
        { type: "solution", title: "Our Solution", content: "{{solution_details}}" },
        { type: "features", title: "Key Features", items: ["{{feature_1}}", "{{feature_2}}", "{{feature_3}}"] },
        { type: "pricing", title: "Investment", content: "{{pricing_info}}" },
        { type: "cta", title: "Next Steps", content: "{{call_to_action}}" }
      ]
    }
  },
  {
    name: "Product Demo Site",
    description: "Interactive product showcase with feature highlights and benefits",
    category: "Sales",
    thumbnail: "/images/demo-template.jpg",
    content: {
      sections: [
        { type: "header", title: "{{product_name}}", subtitle: "{{product_tagline}}" },
        { type: "overview", title: "Product Overview", content: "{{overview_text}}" },
        { type: "features", title: "Features & Benefits", items: ["{{benefit_1}}", "{{benefit_2}}", "{{benefit_3}}"] },
        { type: "demo", title: "Live Demo", content: "{{demo_video_url}}" },
        { type: "testimonials", title: "What Customers Say", content: "{{testimonial_text}}" },
        { type: "contact", title: "Get Started", content: "{{contact_info}}" }
      ]
    }
  },
  {
    name: "Startup Investor Deck",
    description: "Comprehensive pitch deck for startups seeking investment",
    category: "Startup",
    thumbnail: "/images/investor-template.jpg",
    content: {
      sections: [
        { type: "cover", title: "{{startup_name}}", subtitle: "{{elevator_pitch}}" },
        { type: "problem", title: "Problem", content: "{{market_problem}}" },
        { type: "solution", title: "Solution", content: "{{solution_approach}}" },
        { type: "market", title: "Market Opportunity", content: "{{market_size}}" },
        { type: "traction", title: "Traction", content: "{{current_metrics}}" },
        { type: "financials", title: "Financial Projections", content: "{{revenue_projections}}" },
        { type: "team", title: "Team", content: "{{team_bios}}" },
        { type: "funding", title: "Funding Ask", content: "{{investment_amount}}" }
      ]
    }
  },
  {
    name: "Analytics Dashboard",
    description: "Data-driven presentation template with charts and metrics",
    category: "Analytics",
    thumbnail: "/images/analytics-template.jpg",
    content: {
      sections: [
        { type: "title", title: "{{report_title}}", subtitle: "{{reporting_period}}" },
        { type: "summary", title: "Executive Summary", content: "{{key_insights}}" },
        { type: "metrics", title: "Key Performance Indicators", content: "{{kpi_data}}" },
        { type: "charts", title: "Performance Analysis", content: "{{chart_data}}" },
        { type: "trends", title: "Trends & Insights", content: "{{trend_analysis}}" },
        { type: "recommendations", title: "Recommendations", content: "{{action_items}}" }
      ]
    }
  },
  {
    name: "Case Study Report",
    description: "Professional case study template showcasing client success stories",
    category: "Sales",
    thumbnail: "/images/case-study-template.jpg",
    content: {
      sections: [
        { type: "header", title: "Case Study: {{client_name}}", subtitle: "{{project_overview}}" },
        { type: "challenge", title: "The Challenge", content: "{{client_challenge}}" },
        { type: "approach", title: "Our Approach", content: "{{solution_methodology}}" },
        { type: "implementation", title: "Implementation", content: "{{implementation_details}}" },
        { type: "results", title: "Results", content: "{{measurable_outcomes}}" },
        { type: "testimonial", title: "Client Testimonial", content: "{{client_quote}}" }
      ]
    }
  },
  {
    name: "Quarterly Business Review",
    description: "Comprehensive business review template for stakeholder presentations",
    category: "Analytics",
    thumbnail: "/images/qbr-template.jpg",
    content: {
      sections: [
        { type: "agenda", title: "Quarterly Review Agenda", content: "{{meeting_agenda}}" },
        { type: "performance", title: "Performance Overview", content: "{{performance_summary}}" },
        { type: "achievements", title: "Key Achievements", content: "{{major_wins}}" },
        { type: "challenges", title: "Challenges & Solutions", content: "{{challenges_faced}}" },
        { type: "roadmap", title: "Upcoming Roadmap", content: "{{future_plans}}" },
        { type: "action_items", title: "Action Items", content: "{{next_steps}}" }
      ]
    }
  }
];

export async function seedTemplates() {
  try {
    console.log("Seeding templates...");
    
    // Insert templates
    for (const template of sampleTemplates) {
      await db.insert(templates).values(template).onConflictDoNothing();
    }
    
    console.log("Templates seeded successfully!");
  } catch (error) {
    console.error("Error seeding templates:", error);
  }
}