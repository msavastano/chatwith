import React, { useState, useEffect } from "react";

interface TypingTextProps {
  text: string;
  delay: number;
}

const TypingText: React.FC<TypingTextProps> = ({ text, delay }) => {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(typingInterval);
        return;
      }

      setDisplayText((prevText) => prevText + text[currentIndex]);
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }, delay);

    return () => {
      clearInterval(typingInterval);
    };
  }, [text, delay, currentIndex]);

  return <span className="text-xl">{displayText}</span>;
};

export default TypingText;
