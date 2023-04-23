import * as React from "react";
import type { ChatCompletionResponseMessage } from "openai";
import { Configuration, OpenAIApi } from "openai";
import { useEffect, useState } from "react";
import TypingText from "./TypingText";

export function ChatGPT({
  apikey,
  prompt,
  persona,
  setPrompt,
  completionLoading,
  setCompletionLoading,
}: {
  apikey: string | undefined;
  prompt: string;
  persona: string;
  setPrompt: (value: React.SetStateAction<string>) => void
  setCompletionLoading: (value: React.SetStateAction<boolean>) => void
  completionLoading: boolean;
}) {
  const person = persona;
  const initMessages: Array<ChatCompletionResponseMessage> = [
    {
      role: "system",
      content: `Answer every question like you are ${person}`,
    },
  ];
  const [messages, setMessages] =
    useState<Array<ChatCompletionResponseMessage>>(initMessages);
  const [chatMessages, setChatMessages] =
    useState<Array<ChatCompletionResponseMessage>>(initMessages);

  const configuration = new Configuration({
    apiKey: apikey,
  });
  const openai = new OpenAIApi(configuration);

  async function callGPT() {
    return await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      messages: [...messages, { role: "user", content: prompt }],
    });
  }

  useEffect(() => {
    if (prompt) {
      setCompletionLoading(true);
      callGPT().then((r) => {
        console.log(r.data);
        if (r.data.choices[0].message) {
          setMessages([
            ...messages,
            { role: "user", content: prompt },
            r.data.choices[0].message,
          ]);
          setChatMessages([
            { role: "user", content: prompt },
            r.data.choices[0].message,
            ...chatMessages,
          ]);
        }
      }).finally(() => { 
        setPrompt('');
        setCompletionLoading(false) });
    }
  }, [prompt]);

  useEffect(() => {
    setMessages(initMessages);
    setChatMessages(initMessages);
  }, [persona]);

  return (
    <>
      {completionLoading ? (
        <progress className="progress w-56"></progress>
      ) : null}
      {chatMessages.map((message) => {
        return (
          <div key={message.content}>
            <p className="text-lg text-slate-600">
              {message.role === "system" || message.role === "user"
                ? "User"
                : person}
              :
            </p>
            {message.role === "system" || message.role === "user" ? (
              <p className="text-xl">{message.content}</p>
            ) : (
              <>
                <TypingText text={message.content} delay={20} />
                <div className="divider"></div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
