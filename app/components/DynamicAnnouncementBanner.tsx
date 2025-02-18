import { useState, useEffect } from "react";

const DynamicAnnouncementBanner = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const difference = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return {
        hours: hours.toString().padStart(2, "0"),
        minutes: minutes.toString().padStart(2, "0"),
        seconds: seconds.toString().padStart(2, "0"),
      };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const progressPercentage = () => {
    const now = new Date();
    const totalSecondsInDay = 24 * 60 * 60;
    const secondsPassed =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return ((totalSecondsInDay - secondsPassed) / totalSecondsInDay) * 100;
  };

  const handleCreateNowClick = () => {
    // Find the name input and focus it
    const element = document.getElementById("name");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
    }
  };

  return (
    <div className="relative bg-indigo-300">
      {/* Progress bar */}

      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="text-neutral-900 font-bold">
            Create your token for only 0.1 SOL - Offer ends in:
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-xl">
                {timeLeft.hours}
              </span>
              <span className="text-neutral-900 text-xs">HRS</span>
            </div>
            <span className="text-neutral-900 text-xl">:</span>
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-xl">
                {timeLeft.minutes}
              </span>
              <span className="text-neutral-900 text-xs">MIN</span>
            </div>
            <span className="text-neutral-900 text-xl">:</span>
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-xl">
                {timeLeft.seconds}
              </span>
              <span className="text-neutral-900 text-xs">SEC</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicAnnouncementBanner;
