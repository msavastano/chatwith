import type OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";
import * as React from "react";
// import OpenAI from "openai";

import { useEffect, useState } from "react";

// function that calls catfacts api - https://catfact.ninja/fact
async function catfacts(limit = "1") {
  const response = await fetch(`https://catfact.ninja/facts?limit=${limit}`);
  const data = await response.json();
  return data.data;
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
          model,
          temperature: null,
          messages: [...messages, { role: "user", content: prompt }],
          top_p: parseFloat(num.toFixed(1)),
          functions: [
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
          function_call: "auto",
          stream: true,
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
            console.debug(chunk.choices[0]?.delta?.content || "");
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
      {chatMessages.map((message) => {
        const cl =
          message.role !== "system" && message.role !== "user"
            ? "bg-gray-200 mb-7 mt-2 mr-2 ml-2"
            : "bg-inherit m-2";
        return (
          <div
            key={message.content as string}
            className={`${cl} border-spacing-1 rounded-lg border p-3 shadow-md`}
          >
            <p className="text-base-600 text-lg font-bold italic text-red-950">
              {message.role === "system" || message.role === "user"
                ? ""
                : `${person}`}
            </p>
            <p className="text-xl">{message.content as string}</p>
          </div>
        );
      })}
    </>
  );
}
