import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Mail, BookOpen, Users, ArrowRight } from "lucide-react";

const AITwinThankYou = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkoutStatus = searchParams.get("checkout");

  useEffect(() => {
    if (checkoutStatus !== "success") {
      navigate("/ai-twin-formula", { replace: true });
    }
  }, [checkoutStatus, navigate]);

  if (checkoutStatus !== "success") return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        background: "linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #1A1A2E 100%)",
      }}
    >
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Success icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #D63384)" }}
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1
            className="text-4xl md:text-5xl font-bold"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #D63384)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            You're In! 🎉
          </h1>
          <p className="text-xl text-gray-300">
            Your purchase of <span className="font-semibold text-white">The AI Twin Formula</span> is complete.
          </p>
        </div>

        {/* Steps card */}
        <div
          className="rounded-2xl p-8 text-left space-y-6"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(124, 58, 237, 0.3)",
          }}
        >
          <h2 className="text-2xl font-bold text-white text-center">Here's What To Do Next</h2>

          <div className="space-y-5">
            {/* Step 1 */}
            <div className="flex gap-4 items-start">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)" }}
              >
                <Mail className="w-5 h-5" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Step 1: Check Your Email</h3>
                <p className="text-gray-400 mt-1">
                  You'll receive an email with your access link to the{" "}
                  <span className="text-white font-medium">Launchely Skool Community</span>. Check your inbox (and spam/promotions folder, just in case).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(214, 51, 132, 0.2)", border: "1px solid rgba(214, 51, 132, 0.4)" }}
              >
                <Users className="w-5 h-5" style={{ color: "#D63384" }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Step 2: Log Into Skool</h3>
                <p className="text-gray-400 mt-1">
                  Click the link in your email to join the community. If you don't have a Skool account yet, creating one is free and takes 30 seconds.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(124, 58, 237, 0.2)", border: "1px solid rgba(124, 58, 237, 0.4)" }}
              >
                <BookOpen className="w-5 h-5" style={{ color: "#7C3AED" }} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Step 3: Click on "Classroom"</h3>
                <p className="text-gray-400 mt-1">
                  Once inside the Skool community, click on{" "}
                  <span className="font-semibold text-white">"Classroom"</span> in the top navigation to access{" "}
                  <span className="font-semibold text-white">The AI Twin Formula</span> course. All 9 modules are waiting for you.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <a
            href="https://www.skool.com/launchely"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #D63384)",
              boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)",
            }}
          >
            Go to Skool Community
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-500 text-sm">
            Questions? Email us at{" "}
            <a href="mailto:info@cre8visions.com" className="underline" style={{ color: "#7C3AED" }}>
              info@cre8visions.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AITwinThankYou;
