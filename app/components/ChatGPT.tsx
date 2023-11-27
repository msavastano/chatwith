import React, { useEffect, useState } from "react";
import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

function getDateTime() {
  let date = new Date();
  return {
    day: date.getDay(),
    month: date.getMonth() + 1,
    dayOfMonth: date.getDate(),
    year: date.getFullYear(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
  };
}

// function that calls catfacts api - https://catfact.ninja/fact
async function catfacts(limit = "1") {
  const response = await fetch(`https://catfact.ninja/facts?limit=${limit}`);
  const data = await response.json();
  return data.data;
}

async function rt(movie: string, key: string) {
  const response = await fetch(
    `https://flixster.p.rapidapi.com/search?query=${movie}`,
    {
      headers: {
        "X-RapidAPI-Key": key || "",
        "X-RapidAPI-Host": "flixster.p.rapidapi.com",
      },
    }
  );
  const data = await response.json();
  return data.data;
}

async function getStockInfo(symbol: string, key: string) {
  const options = {
    headers: {
      'X-RapidAPI-Key': key || "",
      'X-RapidAPI-Host': 'alpha-vantage.p.rapidapi.com'
    }
  };
  const response = await fetch(
    `https://alpha-vantage.p.rapidapi.com/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&datatype=json`,
    {
      headers: options.headers,
    });
  const data = await response.json();
  return data;
}

async function weather(city: string, key: string) {
  const response = await fetch(
    `https://weatherapi-com.p.rapidapi.com/current.json?q=${city}`,
    {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": "weatherapi-com.p.rapidapi.com",
      },
    }
  );
  const data = await response.json();
  return data;
}

export function ChatGPT({
  prompt,
  persona,
  setPrompt,
  completionLoading,
  setCompletionLoading,
  model,
  setApiError,
  temp,
  openai,
  rtKey,
}: {
  prompt: string;
  persona: string;
  setPrompt: (value: React.SetStateAction<string>) => void;
  setCompletionLoading: (value: React.SetStateAction<boolean>) => void;
  completionLoading: boolean;
  model: string;
  setApiError: React.Dispatch<React.SetStateAction<string>>;
  temp: string;
  openai: OpenAI;
  rtKey: string;
}) {
  const person = persona;
  const initMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `Answer every question like you are ${person}`,
    },
  ];
  const [messages, setMessages] = useState(initMessages);
  const [chatMessages, setChatMessages] = useState(initMessages);

  useEffect(() => {
    setPrompt("");
  }, [chatMessages]);

  useEffect(() => {
    if (prompt) {
      setCompletionLoading(true);
      const num = parseInt(temp) * 0.1;
      const fetchData = async () => {
        const stream = openai.beta.chat.completions.stream({
          stream: true,
          model,
          temperature: null,
          messages: [...messages, { role: "user", content: prompt }],
          top_p: parseFloat(num.toFixed(1)),
          function_call: "auto",
          functions: [
            {
              name: "getStockInfo",
              description: "Get the last 100 days of a company's stock value in USD (high, low, close, open, volume of each day).  Must pass the correct stock symbol",
              parameters: {
                type: "object",
                properties: {
                  symbol: {
                    type: "string",
                    description:
                      'The symbol for the stock that user wnat information on',
                  },
                },
                require: ["symbol"],
              },
            },
            {
              name: "getDateTime",
              description: "Get the current date and time.",
              parameters: {
                type: "object",
                properties: {},
                require: [],
              },
            },
            {
              name: "rt",
              description:
                "Get the rotten tomatoes ratings and user ratings of movies",
              parameters: {
                type: "object",
                properties: {
                  movie: {
                    type: "string",
                    description:
                      "The movie title to get ratings for",
                  },
                },
                required: ["movie"],
              },
            },
            {
              name: "weather",
              description: "Get the current weather of a city",
              parameters: {
                type: "object",
                properties: {
                  city: {
                    type: "string",
                    description: "The location to check the weather of",
                  },
                },
                required: ["city"],
              },
            },
            {
              name: "catfacts",
              description: "Get random cat facts",
              parameters: {
                type: "object",
                properties: {
                  limit: {
                    type: "string",
                    description:
                      'The number of cat facts to return. Defaults to "1".',
                  },
                },
                required: [],
              },
            },
          ],
        });

        let ret = "";
        for await (const chunk of stream) {
          ret += chunk.choices[0]?.delta?.content || "";
          console.debug(chunk);
          setMessages([
            ...messages,
            { role: "user", content: prompt },
            {
              role: "assistant",
              content: ret,
            },
          ]);
          setChatMessages([
            { role: "user", content: prompt },
            {
              role: "assistant",
              content: ret,
            },
            ...chatMessages,
          ]);
        }

        const chatCompletion = await stream.finalChatCompletion();
        const wantsToUseFunction =
          chatCompletion.choices[0].finish_reason === "function_call";
        if (wantsToUseFunction) {
          const functionToUse =
            chatCompletion.choices[0].message?.function_call;
          let dataToReturn = {};

          if (functionToUse?.name === "catfacts") {
            const args = JSON.parse(functionToUse.arguments) as any;
            dataToReturn = await catfacts(args.limit);
          }
          if (functionToUse?.name === "rt") {
            const args = JSON.parse(functionToUse.arguments) as any;
            dataToReturn = await rt(args.movie, rtKey);
          }
          if (functionToUse?.name === "getStockInfo") {
            const args = JSON.parse(functionToUse.arguments) as any;
            dataToReturn = await getStockInfo(args.symbol, rtKey);
          }
          if (functionToUse?.name === "getDateTime") {
            dataToReturn = getDateTime();
          }
          if (functionToUse?.name === "weather") {
            const args = JSON.parse(functionToUse.arguments) as any;
            dataToReturn = await weather(args.city, rtKey);
          }
          const stream = openai.beta.chat.completions.stream({
            model,
            temperature: null,
            messages: [
              ...messages,
              { role: "user", content: prompt },
              {
                role: "function",
                name: functionToUse?.name || "",
                content: JSON.stringify(dataToReturn),
              },
            ],
            top_p: parseFloat(num.toFixed(1)),

            stream: true,
          });

          let ret2 = "";
          for await (const chunk of stream) {
            console.debug(chunk);
            ret2 += chunk.choices[0]?.delta?.content || "";
            setMessages([
              ...messages,
              { role: "user", content: prompt },
              {
                role: "assistant",
                content: ret2,
              },
            ]);
            setChatMessages([
              { role: "user", content: prompt },
              {
                role: "assistant",
                content: ret2,
              },
              ...chatMessages,
            ]);
          }
        }
        setCompletionLoading(false);
      };

      fetchData();
    }
  }, [prompt]);

  useEffect(() => {
    if (persona) {
      setMessages(initMessages);
      setChatMessages(initMessages);
    }
  }, [persona]);

  return (
    <>
      {completionLoading ? (
        <progress className="progress w-56"></progress>
      ) : null}
      {chatMessages
        .filter((message) => message.role !== "system")
        .map((message) => {
          const cl =
            message.role !== "user"
              ? "bg-gray-200 mb-7 mt-2 mr-2 ml-2"
              : "bg-inherit m-2";
          return (
            <>
              <div
                key={message.content as string}
                className={`${cl} border-spacing-1 rounded-lg border p-3 shadow-md`}
              >
                <p className="text-base-600 text-sm font-bold italic text-red-950">
                  {message.role === "system" || message.role === "user"
                    ? ""
                    : `${person}`}
                </p>
                <p className="whitespace-pre-wrap">
                  {message.content as string}
                </p>
              </div>
            </>
          );
        })}
    </>
  );
}
