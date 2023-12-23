// import type { ChatSession } from "@google/generative-ai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LoaderArgs } from "@remix-run/server-runtime";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/server-runtime";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";

export async function loader({ params, request }: LoaderArgs) {
  const gemKey = process.env.GEMINI_KEY;
  const rtKey = process.env.RT_KEY;

  return json({ gemKey, rtKey });
}

export default function Gemini() {
  const data = useLoaderData<typeof loader>();
  const genAI = new GoogleGenerativeAI(data.gemKey || "");
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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
    return data.data.search.movies[0];
  }

  // const prompt = "Write a story about a magic backpack."
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [promptSend, setPromptSend] = useState("");
  // const [chat, setChat] = useState<ChatSession>(model.startChat());
  type Contents = {
    role: string;
    parts: {
      text: string;
    };
  };

  type Tools = {
    function_declarations: []
  }

  const [history, setHistory] = useState<{
    contents: Contents[];
    tools: Tools[];
  }>({
    contents: [],
    tools: [],
  });

  useEffect(() => {
    if (promptSend) {
      setHistory((h) => {
        console.log('h', h)
        return {
          contents: [
            ...h.contents,
            {
              role: "user",
              parts: {
                text: promptSend,
              },
            }
          ],
          tools: [...toolContests.tools],
        };
      });
    }
  }, [promptSend]);

  const handleReset = () => {
    setPrompt("");
    setPromptSend("");
    // setChat(model.startChat());
    setHistory({
      contents: [],
      tools: [],
    })
  };

  const handlePromptChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    e.preventDefault();
  };

  const handleSend = () => {
    setPromptSend(prompt);
    setPrompt("");
  };

  const toolContests = {
    tools: [
      {
        function_declarations: [
          {
            name: "movie_ratings",
            description:
              "Get the rotten tomatoes ratings and user ratings of movies",
            parameters: {
              type: "object",
              properties: {
                movie: {
                  type: "string",
                  description: "The movie title to get ratings for",
                },
              },
              required: ["movie"],
            },
          },
        ],
      },
    ],
  };

  useEffect(() => {
    // async function call() {
    //   const response = chat.sendMessage([
    //     {
    //       text: promptSend,
    //     },
    //   ]);
    //   setText((await response).response.text());
    // }

    async function funcCall() {
      console.log('hist', history)

      const result = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${data.gemKey}`,
        {
          method: "post",
          body: JSON.stringify(history),
        }
      );
      const response = await result.json();
      const fc = response.candidates[0].content.parts[0].functionCall;
      type RT = {
        search?: any;
      };
      let dataToReturn: RT = {};

      if (fc?.name === "movie_ratings") {
        dataToReturn = await movie_ratings(fc.args.movie, data.rtKey || "");
        const functionCallContents = {
          tools: [...history.tools],
          contents: [
            ...history.contents,
            {
              role: "model",
              parts: [
                {
                  functionCall: {
                    name: fc.name,
                    args: {
                      movie: fc.args.movie,
                    },
                  },
                },
              ],
            },
            {
              role: "function",
              parts: [
                {
                  functionResponse: {
                    name: fc.name,
                    response: {
                      name: fc.name,
                      content: dataToReturn,
                    },
                  },
                },
              ],
            },
          ],
        };


        const final = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${data.gemKey}`,
          {
            method: "post",
            body: JSON.stringify(functionCallContents),
          }
        );
        const f = await final.json();
        setHistory((h) => {
          return {
            tools: [...h.tools],
            contents: [...history.contents, 
              // {
              //   role: "function",
              //   parts: [
              //     {
              //       functionResponse: {
              //         name: fc.name,
              //         response: {
              //           name: fc.name,
              //           content: dataToReturn,
              //         },
              //       },
              //     },
              //   ],
              // },
              {
                role: 'model',
                parts: {
                  text: f.candidates[0].content.parts[0].text
                }
              }],
          }
        })
        setText(JSON.stringify(f.candidates[0].content.parts[0].text));
      } else {
        console.log('response', response)
        setText(response.candidates[0].content.parts[0].text)
        setHistory(h => {
          return {
            tools: [...h.tools],
            contents: [...history.contents, 
              {
                role: 'model',
                parts: {
                  text: response.candidates[0].content.parts[0].text
                }
              }]
          }
        })
      }
      setPromptSend("");
    }

    if (promptSend) {
      funcCall();
    }
  }, [history]);

  return (
    <div>
      <p className="whitespace-pre-wrap">{text}</p>
      <div className="m-2 flex justify-between">
        <input
          value={prompt}
          onChange={handlePromptChange}
          id="search"
          name="search"
          type="text"
          placeholder="Prompt"
          className="input-bordered input mr-2 w-full"
          // disabled={Boolean(!assistant)}
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
    </div>
  );
}
