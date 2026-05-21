import Navbar from "@/components/Navbar";
import SmartTemplates from "@/components/SmartTemplates";

const TemplatesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <SmartTemplates />
      </div>
    </div>
  );
};

export default TemplatesPage;
