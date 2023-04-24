import type { V2_MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ImagesResponse } from "openai";
import type { ChangeEvent } from "react";
import { Configuration, OpenAIApi } from "openai";
import { useEffect, useState } from "react";
import { ChatGPT } from "~/components/ChatGPT";

export async function loader({ params, request }: LoaderArgs) {
  const apikey = process.env.OPENAI_API_KEY;
  return json({ apikey });
}

export const meta: V2_MetaFunction = () => {
  return [{ title: "ChatWith" }];
};

export default function Index() {
  const data = useLoaderData<typeof loader>();
  const [prompt, setPrompt] = useState('');
  const [promptSend, setPromptSend] = useState('');
  const [persona, setPersona] = useState('');
  const [personaSend, setPersonaSend] = useState('');
  const [completionLoading, setCompletionLoading] = useState(false);
  const [image, setImage] = useState<ImagesResponse>();
  const [noImage, setNoImage] = useState('');
  const [isImage, setIsImage] = useState(false);
  const [key, setKey] = useState('');
  const [useKey, setUseKey] = useState('');
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [apiError, setApiError] = useState('');
  const [temp, setTemp] = useState("10");
  const [generatingImage, setGeneratingImage] = useState(false);

  const configuration = new Configuration({
    apiKey: useKey || data.apikey,
  });

  const handleInputChange = () => {
    setIsImage(!isImage);
  };

  const handleModelChange = () => {
    if (model === "gpt-3.5-turbo") {
      setModel("gpt-4");
    } else {
      setModel("gpt-3.5-turbo");
    }
  };

  const openai = new OpenAIApi(configuration);

  async function callDallE() {
    return await openai.createImage({
      prompt: `Cartoonish characature of ${persona}`,
      size: "256x256",
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
    setApiError('');
    setUseKey(key);
    setKey('');
  };

  const handleResetKey = () => {
    setUseKey('');
    setKey('');
  };

  const handleResetPersona = () => {
    setPersonaSend('');
    setPersona('');
    setPrompt('');
    setPromptSend('');
    setApiError('');
    setNoImage('');
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
    setPersona('');
    setImage(undefined);
    if (persona.length > 0 && isImage) {
      setGeneratingImage(true);
      callDallE()
        .then((i) => {
          console.log(i);
          setImage(i.data);
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
          <div className="m-5 sm:w-full lg:w-1/2">
            <div className="card w-auto bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">API Key</h2>
                {Boolean(useKey) && (
                  <p className="text-md ml-4 text-lime-900">
                    Your Open AI api key is being used. See{" "}
                    <a className="link" href="https://openai.com/pricing">
                      OpenAI pricing
                    </a>
                  </p>
                )}

                
                <div className="ml-4">
                {!Boolean(useKey) && (
                  <><input
                      value={key}
                      onChange={handleKeyChange}
                      id="key"
                      name="key"
                      type="text"
                      placeholder="OpenAI API Key"
                      className="input-bordered input m-2 w-9/12"
                      disabled={Boolean(useKey)} /><button
                        className="btn-primary btn"
                        onClick={handleKeySet}
                        disabled={Boolean(useKey) || !Boolean(key)}
                      >
                        {!Boolean(useKey) ? "Use" : "TY"}
                      </button></>
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
        <div className="m-5 sm:w-full lg:w-1/2">
          <p className="mt-3 text-xl">
            SET A PERSONA AND PROMPT TO START CHATTING
          </p>
          <div className="m-4">
            <input
              value={persona}
              onChange={handlePersonaChange}
              id="persona"
              name="persona"
              type="text"
              placeholder="a very helpful assistant"
              className="input-bordered input m-2 w-1/2"
            />
            <button
              className="btn-primary btn"
              onClick={handlePersonaSet}
              disabled={!Boolean(persona)}
            >
              Set
            </button>

            <div className="flex flex-col">
              <div className="form-control w-72 border border-spacing-1 border-primary rounded-lg m-1">
                <label className="label cursor-pointer">
                  <span className="label-text">ChatGPT 3.5 turbo</span>
                  <input
                    type="checkbox"
                    className="toggle-primary toggle"
                    checked={model === "gpt-4"}
                    onChange={handleModelChange}
                    disabled={Boolean(personaSend)}
                  />
                  <span className="label-text">GPT-4</span>
                </label>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="form-control w-52 border border-spacing-1 border-primary rounded-lg m-1">
                <label className="label cursor-pointer">
                  <span className="label-text">Generate Image</span>
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
              min={5}
              max={15}
              value={temp}
              className="range range-primary mr-10 mt-5 disabled:opacity-30"
            />
            <div className="flex w-full justify-between px-2 text-xs">
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
            apikey={useKey || data.apikey}
            prompt={promptSend}
            persona={personaSend}
            setPrompt={setPrompt}
            completionLoading={completionLoading}
            setCompletionLoading={setCompletionLoading}
            model={model}
            setApiError={setApiError}
            temp={temp}
          />
        </div>
      )}
    </div>
  );
}
