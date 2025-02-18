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

  return (
    <div className="relative bg-indigo-300">
      {/* Progress bar */}

      <div className="container mx-auto px-4 py-3 text-sm sm:text-base">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4">
          <div className="text-neutral-900 font-bold">
            Create your token for only 0.1 SOL - Offer ends in:
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-base sm:text-lg">
                {timeLeft.hours}
              </span>
              <span className="text-neutral-900 text-xs">HRS</span>
            </div>
            <span className="text-neutral-900 text-xl">:</span>
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-base sm:text-lg">
                {timeLeft.minutes}
              </span>
              <span className="text-neutral-900 text-xs">MIN</span>
            </div>
            <span className="text-neutral-900 text-xl">:</span>
            <div className="flex flex-col items-center">
              <span className="text-neutral-900 font-bold text-base sm:text-lg">
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
