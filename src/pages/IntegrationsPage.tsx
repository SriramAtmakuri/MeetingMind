import Navbar from "@/components/Navbar";
import Integrations from "@/components/Integrations";

const IntegrationsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <Integrations />
      </div>
    </div>
  );
};

export default IntegrationsPage;
