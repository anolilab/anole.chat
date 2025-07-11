import { z } from "zod/v4";

const getCatFact = async () => {
    try {
        const res = await fetch("https://catfact.ninja/fact");
        const data = await res.json();

        return { content: [{ text: `🐱 ${data.fact}`, type: "text" }] };
    } catch {
        return { content: [{ text: "Failed to fetch cat fact", type: "text" }] };
    }
};

const getQuote = async () => {
    try {
        const res = await fetch("https://api.quotable.io/random");
        const data = await res.json();

        return {
            content: [
                {
                    text: `💭 "${data.content}" - ${data.author}`,
                    type: "text",
                },
            ],
        };
    } catch {
        return { content: [{ text: "Failed to fetch quote", type: "text" }] };
    }
};

const getJoke = async () => {
    try {
        const res = await fetch("https://official-joke-api.appspot.com/random_joke");
        const data = await res.json();

        return {
            content: [
                {
                    text: `😄 ${data.setup}\n\n${data.punchline}`,
                    type: "text",
                },
            ],
        };
    } catch {
        return { content: [{ text: "Failed to fetch joke", type: "text" }] };
    }
};

// const getUsers = async () => {
//   try {
//     const res = await fetch("https://jsonplaceholder.typicode.com/users");
//     const data = await res.json();

//     return {
//       content: [
//         {
//           type: "text",
//           text: `Users: ${JSON.stringify(data)}`,
//         },
//       ],
//     };
//   } catch (error) {
//     return { content: [{ type: "text", text: "Failed to fetch joke" }] };
//   }
// };

const getWelcomeMessage = async ({ name }: { name: string }) => {
    return {
        content: [{ text: `Welcome to the AI, ${name}!`, type: "text" }],
    };
};

const calculateBMI = async ({ height, weight }: { height: number; weight: number }) => {
    const bmi = weight / (height * height);

    console.log("💪 BMI", bmi);

    return {
        content: [{ text: `Your BMI is ${bmi}`, type: "text" }],
    };
};

const getTodos = async () => {
    console.log("🔑 Todos");

    return {
        content: [{ text: `Todos: ${JSON.stringify({})}`, type: "text" }],
    };
};

export const tools = [
    {
        callback: getCatFact,
        description: "Get a random cat fact",
        name: "getCatFact",
    },
    {
        callback: getQuote,
        description: "Get a random inspirational quote",
        name: "getQuote",
    },
    {
        callback: getJoke,
        description: "Get a random programming joke",
        name: "getJoke",
    },

    {
        callback: getWelcomeMessage,
        description: "Get the welcome message",
        inputSchema: z.object({
            name: z.string(),
        }).strict(),
        name: "getWelcomeMessage",
    },
    {
        callback: calculateBMI,
        description: "Calculate the BMI of a person",
        inputSchema: z.object({
            height: z.number(),
            weight: z.number(),
        }).strict(),
        name: "calculateBMI",
    },
    {
        callback: getTodos,
        description: "Get the todos from the app",
        name: "getTodos",
    },
];
