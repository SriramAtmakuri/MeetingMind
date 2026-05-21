import Navbar from "@/components/Navbar";
import PrivacyCompliance from "@/components/PrivacyCompliance";

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <PrivacyCompliance />
      </div>
    </div>
  );
};

export default PrivacyPage;
