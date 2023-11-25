import type { V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ChangeEvent } from "react";
import OpenAI from "openai";
import { useEffect, useState } from "react";
import { ChatGPT } from "~/components/ChatGPT";
export async function loader({ params, request }: LoaderArgs) {
  const apikey = process.env.OPENAI_API_KEY;
  const rtKey = process.env.RT_KEY;
  return json({ apikey, rtKey });
}

export const meta: V2_MetaFunction = () => {
  return [{ title: "ChatWith" }];
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [prompt, setPrompt] = useState("");
  const [promptSend, setPromptSend] = useState("");
  const [persona, setPersona] = useState("");
  const [personaSend, setPersonaSend] = useState("");
  const [completionLoading, setCompletionLoading] = useState(false);
  const [image, setImage] = useState<OpenAI.Images.ImagesResponse>();
  const [noImage, setNoImage] = useState("");
  const [isImage, setIsImage] = useState(false);
  const [key, setKey] = useState("");
  const [useKey, setUseKey] = useState("My Api Key");
  const [model, setModel] = useState("gpt-3.5-turbo-1106");
  const [apiError, setApiError] = useState("");
  const [temp, setTemp] = useState("5");

  const [generatingImage, setGeneratingImage] = useState(false);

  const openai = new OpenAI({
    apiKey: data.apikey || useKey,
    dangerouslyAllowBrowser: true,
  });

  const handleInputChange = () => {
    setIsImage(!isImage);
  };

  const handleModelChange = () => {
    if (model === "gpt-3.5-turbo-1106") {
      setModel("gpt-4-1106-preview");
    } else {
      setModel("gpt-3.5-turbo-1106");
    }
  };

  async function callDallE() {
    return await openai.images.generate({
      prompt: `Cartoonish characature of ${persona}`,
      size: "1024x1024",
      model: "dall-e-3",
    });
  }

  const handlePromptChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    e.preventDefault();
  };

  const handleKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKey(e.target.value);
  };

  const handleKeySet = () => {
    setApiError("");
    setUseKey(key);
    setKey("");
  };

  const handleResetKey = () => {
    setUseKey("My Api Key");
    setKey("");
  };

  const handleResetPersona = () => {
    setPersonaSend("");
    setPersona("");
    setPrompt("");
    setPromptSend("");
    setApiError("");
    setNoImage("");
  };

  const handleSend = () => {
    setPromptSend(prompt);
  };

  const handlePersonaChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPersona(e.target.value);
    e.preventDefault();
  };

  const handlePersonaSet = () => {
    if (!persona) {
      setPersonaSend("a very helpful assistant");
    } else {
      setPersonaSend(persona);
    }
    setPersona("");
    setImage(undefined);
    if (persona.length > 0 && isImage) {
      setGeneratingImage(true);
      callDallE()
        .then((i) => {
          console.log(i);
          setImage(i);
        })
        .catch((err) => {
          if (err.message.includes("Request failed with status code 400")) {
            setApiError(`Input related error: ${err.message}`);
          } else {
            setApiError(err.message);
          }
          setNoImage(`Dall-e will not generate image`);
        })
        .finally(() => {
          setGeneratingImage(false);
        });
    }
  };

  const handleRangeChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTemp(e.target.value);
  };

  useEffect(() => {
    if (apiError.includes("API key")) {
      console.log(apiError);
      handleResetKey();
    }
  }, [apiError]);

  return (
    <div className="m-4">
      <div className="hero min-h-fit bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">ChatWith</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-around lg:flex-row-reverse lg:flex-nowrap">
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
        <div className="m-5 w-full lg:w-1/2">
          <div>
            <input
              value={persona}
              onChange={handlePersonaChange}
              id="persona"
              name="persona"
              type="text"
              placeholder="a very helpful assistant"
              className="input m-2 w-10/12 border-spacing-1 rounded-lg border shadow-md"
            />
            <button
              className="btn-primary btn"
              onClick={handlePersonaSet}
              disabled={!Boolean(persona)}
            >
              Set
            </button>

            <div className="flex flex-row">
              <div className="form-control m-1 border-spacing-1 rounded-lg border shadow-sm xl:w-1/3">
                <label className="label cursor-pointer">
                  <span className="label-text mr-1">GPT-4</span>
                  <input
                    type="checkbox"
                    className="toggle-primary toggle"
                    checked={model === "gpt-4-1106-preview"}
                    onChange={handleModelChange}
                    disabled={Boolean(personaSend)}
                  />
                </label>
                <label className="label cursor-pointer">
                  <span className="label-text mr-1">Generate Image</span>
                  <input
                    type="checkbox"
                    className="toggle-primary toggle"
                    checked={isImage}
                    onChange={handleInputChange}
                    disabled={Boolean(personaSend)}
                  />
                </label>
              </div>
            </div>
            <input
              disabled={Boolean(personaSend)}
              onChange={handleRangeChange}
              type="range"
              min={1}
              max={10}
              value={temp}
              className="range range-primary mr-10 mt-5 w-11/12 disabled:opacity-30"
            />
            <div className="flex w-11/12 justify-between px-2 text-xs">
              <span>CONSICE</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>CREATIVE</span>
            </div>
          </div>
        </div>
      </div>

      {personaSend && (
        <div className="border-base-900 m-4 rounded-lg border-2 p-4">
          {Boolean(apiError) && (
            <p className="text-md ml-4 text-red-500">{apiError}</p>
          )}

          {Boolean(personaSend) && (
            <button
              className="btn-primary btn m-2"
              onClick={handleResetPersona}
            >
              Reset Persona
            </button>
          )}

          {generatingImage && (
            <span className="loading loading-spinner loading-md mx-auto flex justify-center"></span>
          )}

          {image ? (
            <img
              className="border-base-900 m-2 mx-auto w-32 rounded-xl border-2"
              alt={persona}
              src={image?.data[0].url}
            />
          ) : (
            noImage &&
            isImage && (
              <p className="border-base-900 m-2 mx-auto w-32 rounded-xl border-2 p-1">
                {noImage}
              </p>
            )
          )}

          <p className="flex justify-center text-3xl">
            Chat with {personaSend}
          </p>

          <div className="m-2 flex justify-between">
            <input
              value={prompt}
              onChange={handlePromptChange}
              id="search"
              name="search"
              type="text"
              placeholder="Prompt"
              className="input-bordered input mr-2 w-full"
              disabled={completionLoading}
            />
            <button
              className="btn-primary btn"
              onClick={handleSend}
              disabled={!Boolean(prompt)}
            >
              Send
            </button>
          </div>
          <ChatGPT
            openai={openai}
            prompt={promptSend}
            persona={personaSend}
            setPrompt={setPrompt}
            completionLoading={completionLoading}
            setCompletionLoading={setCompletionLoading}
            model={model}
            setApiError={setApiError}
            temp={temp}
            rtKey={data.rtKey || ""}
          />
        </div>
      )}
    </div>
  );
}
