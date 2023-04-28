import * as React from "react";
import type { ChatCompletionResponseMessage } from "openai";
import { Configuration, OpenAIApi } from "openai";
import { useEffect, useState } from "react";
import TypingText from "./TypingText";
import type { ClientStreamChatCompletionConfig} from "openai-ext";
import { OpenAIExt } from "openai-ext";

export function ChatGPT({
  apikey,
  prompt,
  persona,
  setPrompt,
  completionLoading,
  setCompletionLoading,
  streaming,
  setPersona,
}: {
  apikey: string | undefined;
  prompt: string;
  persona: string;
  setPrompt: (value: React.SetStateAction<string>) => void;
  setCompletionLoading: (value: React.SetStateAction<boolean>) => void;
  completionLoading: boolean;
  streaming: boolean;
  setPersona: (value: React.SetStateAction<string>) => void;
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

  const streamConfig: ClientStreamChatCompletionConfig = {
    apiKey: apikey || "", // Your API key
    handler: {
      onContent(content, isFinal, xhr) {
        if (content) {
          setMessages([
            ...messages,
            { role: "user", content: prompt },
            { role: 'assistant', content },
          ]);
          setChatMessages([
            { role: "user", content: prompt },
            { role: 'assistant', content },
            ...chatMessages,
          ]);
        }
      },
      onDone(xhr) {
        console.log("Done!");
        setPrompt("");
        setCompletionLoading(false);
      },
      onError(error, status, xhr) {
        console.error(error);
        setPrompt("");
        setCompletionLoading(false);
        setPersona("");
        setChatMessages(initMessages)
        setMessages(initMessages)
      },
    },
  };

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
      if (!streaming) {
        callGPT().then((r) => {
            console.log(r);
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
          })
          .catch((e) => {
            setChatMessages(initMessages)
            setMessages(initMessages)
            console.log(e)
            setPrompt("");
            setCompletionLoading(false);
            setPersona("")
            
          })
          .finally(() => {
            setPrompt("");
            setCompletionLoading(false);
          });
      } else {
        OpenAIExt.streamClientChatCompletion(
          {
            model: "gpt-3.5-turbo",
            messages: [...messages, { role: "user", content: prompt }],
          },
          streamConfig
        );
      }
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
            <p className="text-base-600 text-lg">
              {message.role === "system" || message.role === "user"
                ? "User"
                : person}
              :
            </p>
            {message.role === "system" || message.role === "user" ? (
              <p className="text-xl">{message.content}</p>
            ) : (
              <>
                {!streaming ? (
                  <TypingText text={message.content} delay={20} />
                ) : (
                  <p className="text-xl">{message.content}</p>
                )}
                <div className="divider"></div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
