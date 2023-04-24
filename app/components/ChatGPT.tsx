import * as React from "react";
import type { ChatCompletionResponseMessage } from "openai";
import { useEffect, useState } from "react";
import type { ClientStreamChatCompletionConfig } from "openai-ext";
import { OpenAIExt } from "openai-ext";

export function ChatGPT({
  apikey,
  prompt,
  persona,
  setPrompt,
  completionLoading,
  setCompletionLoading,
  model,
  setApiError,
  temp,
}: {
  apikey: string | undefined;
  prompt: string;
  persona: string;
  setPrompt: (value: React.SetStateAction<string>) => void;
  setCompletionLoading: (value: React.SetStateAction<boolean>) => void;
  completionLoading: boolean;
  model: string;
  setApiError: React.Dispatch<React.SetStateAction<string>>;
  temp: string;
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

  const streamConfig: ClientStreamChatCompletionConfig = {
    apiKey: apikey || '', // Your API key
    handler: {
      onContent(content, isFinal, xhr) {
        if (content) {
          setMessages([
            ...messages,
            { role: "user", content: prompt },
            { role: "assistant", content },
          ]);
          setChatMessages([
            { role: "user", content: prompt },
            { role: "assistant", content },
            ...chatMessages,
          ]);
        }
      },
      onDone(xhr) {
        console.log("Done!");
        setApiError('');
        console.debug("[EventSource]", xhr.responseText);
        setPrompt('');
        setCompletionLoading(false);
      },
      onError(error, status, xhr) {
        const err = JSON.parse(xhr.responseText);
        setApiError(err.error.message);
        setPrompt('');
        setCompletionLoading(false);
      },
    },
  };

  useEffect(() => {
    if (prompt) {
      setCompletionLoading(true);
      const num = parseInt(temp) * 0.1;
      OpenAIExt.streamClientChatCompletion(
        {
          model,
          temperature: parseFloat(num.toFixed(1)),
          messages: [...messages, { role: "user", content: prompt }],
        },
        streamConfig
      );
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
        return (
          <div key={message.content}>
            <p className="text-base-600 text-lg font-bold italic text-red-950">
              {message.role === "system" || message.role === "user"
                ? "User"
                : person}
              :
            </p>
            {message.role === "system" || message.role === "user" ? (
              <p className="text-xl">{message.content}</p>
            ) : (
              <>
                <p className="text-xl">{message.content}</p>
                <div className="divider"></div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
