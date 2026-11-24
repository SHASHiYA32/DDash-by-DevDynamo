import { Footer, FinalCta } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Navbar } from "@/components/landing/navbar";
import { Pricing } from "@/components/landing/pricing";
import { Faq, Features, HowItWorks } from "@/components/landing/sections";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  return (
    <>
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
