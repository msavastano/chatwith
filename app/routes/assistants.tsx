import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ChangeEvent } from "react";
import OpenAI from "openai";
import { useEffect, useState } from "react";

export async function loader({ params, request }: LoaderArgs) {
  const apikey = process.env.OPENAI_API_KEY;

  return json({ apikey });
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [assistant, setAssistant] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [promptSend, setPromptSend] = useState("");
  const [completionLoading, setCompletionLoading] = useState(false);
  const [messages, setMessages] = useState("");
  const [threadID, setThreadID] = useState("");

  const openai = new OpenAI({
    apiKey: data.apikey || "useKey",
    dangerouslyAllowBrowser: true,
  });

  const handleSend = () => {
    setPromptSend(prompt);
    setPrompt("");
  };

  const handleRadioChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrompt("");
    setPromptSend("");
    setAssistant(e.target.value);
    setMessages("");
  };

  const handleReset = () => {
    setPrompt("");
    setPromptSend("");
    setThreadID("");
    setMessages("");
  };

  const handlePromptChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    e.preventDefault();
  };

  useEffect(() => {
    async function getAssistant() {
      let thread;
      if (threadID) {
        thread = await openai.beta.threads.retrieve(threadID);
      } else {
        thread = await openai.beta.threads.create();
        setThreadID(thread.id);
      }
      const userQuestion = promptSend;

      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: userQuestion,
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: assistant,
      });

      let runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );

      while (runStatus.status !== "completed") {
        setCompletionLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        setCompletionLoading(false);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);

      console.table(messages.data);

      const assistantMessages = messages.data.filter(
        (message) => message.run_id === run.id && message.role === "assistant"
      );

      let messagesString = "";
      assistantMessages.forEach((message) => {
        messagesString = `${message.content[0].text.value}\n${messagesString}`;
      });

      console.log(messagesString);
      setMessages(messagesString);
    }
    if (promptSend) {
      getAssistant();
    }
  }, [promptSend]);

  return (
    <div className="m-4">
      <div className="hero min-h-fit bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Assistants</h1>
          </div>
        </div>
      </div>

      <div
        className="w-40"
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleRadioChange(e)}
      >
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Documents Assistant</span>
            <input
              type="radio"
              name="radio-10"
              className="radio"
              value={"asst_MYDhS1eWHOimBGVuehag5WXm"}
            />
          </label>
        </div>
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Math Tutor</span>
            <input
              type="radio"
              name="radio-10"
              className="radio"
              value={"asst_0JJmJ8NnitleFBHZZdE94kPZ"}
            />
          </label>
        </div>
      </div>

      <div className="m-2 flex justify-between">
        <input
          value={prompt}
          onChange={handlePromptChange}
          id="search"
          name="search"
          type="text"
          placeholder="Prompt"
          className="input-bordered input mr-2 w-full"
          disabled={Boolean(!assistant)}
        />
        <button
          className="btn-primary btn"
          onClick={handleSend}
          disabled={Boolean(!prompt)}
        >
          Send
        </button>

        <button className="btn-primary btn ml-2" onClick={handleReset}>
          Reset
        </button>
      </div>
      {completionLoading ? (
        <div>
          <progress className="progress w-56"></progress>
        </div>
      ) : null}

      {messages.length ? (
        <div className={`border-spacing-1 rounded-lg border p-3 shadow-md`}>
          <p className="whitespace-pre-wrap text-xl">{messages}</p>
        </div>
      ) : null}
    </div>
  );
}
