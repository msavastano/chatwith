import { useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import type { ImagesResponse } from "openai";
import type { ChangeEvent } from "react";
import { Configuration, OpenAIApi } from "openai";
import { useState } from "react";
import { ChatGPT } from "~/components/ChatGPT";

export async function loader({ params, request }: LoaderArgs) {
  const apikey = process.env.OPENAI_API_KEY;
  return json({ apikey });
}

export default function ChatPage() {
  const data = useLoaderData<typeof loader>();
  const [prompt, setPrompt] = useState("");
  const [promptSend, setPromptSend] = useState("");
  const [persona, setPersona] = useState("");
  const [personaSend, setPersonaSend] = useState("");
  const [completionLoading, setCompletionLoading] = useState(false);
  const [image, setImage] = useState<ImagesResponse>();
  const [noImage, setNoImage] = useState('')
  const [isImage, setIsImage] = useState(false);
  const configuration = new Configuration({
    apiKey: data.apikey,
  });

  const handleInputChange = () => {
    setIsImage(!isImage);
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
    setImage(undefined)
    if (persona.length > 0 && isImage) {
      callDallE()
        .then((i) => {
          setImage(i.data)
        })
        .catch(err => {
          console.log(err)
          setNoImage(`Dall-e will not generate image for many public figures`);
        })
    }
  };

  return (
    <div className="m-10">
      <div className="hero min-h-fit bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">ChatWith</h1>
          </div>
        </div>
      </div>
      <p className="mt-3 text-xl">
        Set a Persona and Chat (to clear context refresh browser or set another
        persona)
      </p>
      <div className="m-4">
        <input
          value={persona}
          onChange={handlePersonaChange}
          id="persona"
          name="persona"
          type="text"
          placeholder="a very helpful assistant"
          className="input-bordered input-primary input m-2 w-1/3"
        />
        <button className="btn-primary btn" onClick={handlePersonaSet}>
          Set
        </button>
        <div className="flex flex-col">
          <div className="form-control w-52">
            <label className="label cursor-pointer">
              <span className="label-text">Generate Image</span>
              <input
                type="checkbox"
                className="toggle-primary toggle"
                checked={isImage}
                onChange={handleInputChange}
              />
            </label>
          </div>
        </div>
      </div>

      {personaSend && (
        <div className="m-4 rounded-lg border-2 border-gray-900 p-4">
          {image ? (
            <img
              className="m-2 mx-auto w-32 rounded-xl border-2 border-gray-900"
              alt={persona}
              src={image?.data[0].url}
            />
          ) : (
            noImage && isImage &&  <p className="m-2 mx-auto w-32 rounded-xl border-2 border-gray-900 p-1">{noImage}</p>
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
              className="input-bordered input-primary input mr-2 w-full"
              disabled={completionLoading}
            />
            <button className="btn-primary btn" onClick={handleSend}>
              Send
            </button>
          </div>
          <ChatGPT
            apikey={data.apikey}
            prompt={promptSend}
            persona={personaSend}
            setPrompt={setPrompt}
            completionLoading={completionLoading}
            setCompletionLoading={setCompletionLoading}
          />
        </div>
      )}
    </div>
  );
}
