import { Footer, FinalCta } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { Faq, Features, HowItWorks } from "@/components/landing/sections";
import { getSession } from "@/lib/auth";
import { FAQS } from "@/lib/faq";
import { faqJsonLd, softwareJsonLd } from "@/lib/site";

export default async function Home() {
  const session = await getSession();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(FAQS)) }} />
      <Navbar signedIn={!!session} />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing
          current={
            session
              ? { plan: session.business.plan, renewsAt: session.business.planRenewsAt, role: session.user.role }
              : null
          }
        />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
