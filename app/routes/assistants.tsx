import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ChangeEvent } from "react";
import OpenAI from "openai";
import { useEffect, useState } from "react";

export async function loader({ params, request }: LoaderArgs) {
  const apikey = process.env.OPENAI_API_KEY;
  const rtKey = process.env.RT_KEY;
  return json({ apikey, rtKey });
}

export default function Index() {
  async function movie_ratings(movie: string, key: string) {
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

  async function movie_plots(movie: string, key: string) {
    const title = await fetch(
      `https://imdb8.p.rapidapi.com/title/find?q=${movie}`,
      {
        headers: {
          "X-RapidAPI-Key": key || "",
          "X-RapidAPI-Host": "imdb8.p.rapidapi.com",
        },
      }
    );
    const data = await title.json();
    const id = data.results[0].id.replace('title', '').replaceAll("/", "");
    const response = await fetch(
      `https://imdb8.p.rapidapi.com/title/get-plots?tconst=${id}`,
      {
        headers: {
          "X-RapidAPI-Key": key || "",
          "X-RapidAPI-Host": "imdb8.p.rapidapi.com",
        },
      }
    );
    const plotsData = await response.json();
    return plotsData;
  }
  const data = useLoaderData<typeof loader>();
  const [useKey, setUseKey] = useState("My Api Key");
  const [key, setKey] = useState("")
  const [assistant, setAssistant] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [promptSend, setPromptSend] = useState("");
  const [completionLoading, setCompletionLoading] = useState(false);
  const [messageData, setMessageData] = useState<any[]>([]);
  const [threadID, setThreadID] = useState("");

  const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
  };

  const handleKeySet = () => {
    setUseKey(key);
    setKey("");
  };

  const handleResetKey = () => {
    setUseKey("My Api Key");
    setKey("");
  };

  const openai = new OpenAI({
    apiKey: data.apikey || useKey,
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
    setMessageData([]);
  };

  const handleReset = () => {
    setPrompt("");
    setPromptSend("");
    setThreadID("");
    setMessageData([]);
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
        if (runStatus.status === 'requires_action') {
          const promises = runStatus.required_action?.submit_tool_outputs.tool_calls.map(async (call) => {
            if (call.function.name === 'movie_ratings') {
              const args = JSON.parse(call.function.arguments) as any;
              const k = data.rtKey || ''
              const ret = await movie_ratings(args.movie, k)

              return {
                tool_call_id: call.id,
                output: JSON.stringify(ret.search.movies)
              }
            }

            if (call.function.name === 'movie_plots') {
              const args = JSON.parse(call.function.arguments) as any;
              const k = data.rtKey || ''
              const ret = await movie_plots(args.movie, k)

              return {
                tool_call_id: call.id,
                output: JSON.stringify(ret.plots)
              }
            }
          });
          const tool_outputs = await Promise.all(promises);
          console.log(tool_outputs);
          openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, { tool_outputs: tool_outputs });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        setCompletionLoading(false);
      }

      const messages = await openai.beta.threads.messages.list(thread.id);

      console.table(messages.data);

      setMessageData(messages.data);

    }
    if (promptSend) {
      getAssistant();
    }
  }, [promptSend]);

  return (
    <>

      <div className="m-4">
        <div className="hero min-h-fit bg-base-200">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <h1 className="text-5xl font-bold">Assistants</h1>
            </div>
          </div>
        </div>
        {!data.apikey && (
          <div className="m-5 w-full lg:w-1/2">
            <div className="card w-auto bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">API Key</h2>
                {useKey !== "My Api Key" && (
                  <p className="text-md ml-4 text-lime-900">
                    Your Open AI api key is being used. See{" "}
                    <a className="link" href="https://openai.com/pricing">
                      OpenAI pricing
                    </a>
                  </p>
                )}

                <div className="ml-4">
                  {useKey === "My Api Key" && (
                    <>
                      <input
                        value={key}
                        onChange={handleKeyChange}
                        id="key"
                        name="key"
                        type="text"
                        placeholder="OpenAI API Key"
                        className="input-bordered input m-2 w-9/12"
                        disabled={useKey !== "My Api Key"}
                      />
                      <button
                        className="btn-primary btn"
                        onClick={handleKeySet}
                        disabled={useKey !== "My Api Key" || !Boolean(key)}
                      >
                        {useKey === "My Api Key" ? "Use" : "TY"}
                      </button>
                    </>
                  )}

                  {Boolean(useKey) && (
                    <button
                      className="btn-primary btn m-2"
                      onClick={handleResetKey}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
                value={"asst_MYDhS1eWHOimBGVuehag5WXm"} />
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Math Tutor</span>
              <input
                type="radio"
                name="radio-10"
                className="radio"
                value={"asst_0JJmJ8NnitleFBHZZdE94kPZ"} />
            </label>
          </div>
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Movie Functions</span>
              <input
                type="radio"
                name="radio-10"
                className="radio"
                value={"asst_XAg1kPuYuoBuZiorioAtppJU"} />
            </label>
          </div>
        </div>

      
        {messageData
          .slice(0)
          .reverse()
          .filter((message) => message.role !== "system")

          .map((message) => {
            const cl = message.role !== "user"
              ? "bg-gray-200 mb-7 mt-2 mr-2 ml-2"
              : "bg-inherit m-2";
            return (
              <div
                key={message.content[0].text.value as string}
                className={`${cl} border-spacing-1 rounded-lg border p-3 shadow-md`}
              >
                <p className="whitespace-pre-wrap">
                  {message.content[0].text.value as string}
                </p>
              </div>
            );
          })}
          {completionLoading ? (
            <progress className="progress w-56"></progress>
          ) : null}

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
            disabled={Boolean(!assistant)} />
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
    </>
  );
}
