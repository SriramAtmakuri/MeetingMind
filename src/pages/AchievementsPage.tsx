import Navbar from "@/components/Navbar";
import Gamification from "@/components/Gamification";

const AchievementsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <Gamification />
      </div>
    </div>
  );
};

export default AchievementsPage;
