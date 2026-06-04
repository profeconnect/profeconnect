const prisma = require("./prisma");

const tools = [
    {
        type: "function",
        function: {
            name: "buscar_posts",
            description: "Busca publicaciones relacionadas con un tema",
            parameters: {
                type: "object",
                properties: {
                    termino: {
                        type: "string",
                        description: "Tema a buscar"
                    }
                },
                required: ["termino"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "obtener_posts",
            description: "Obtiene los ultimos 10 posts",
            parameters: {
                type: "object",
                properties: {
                    titulo: {
                        type: "string"
                    }
                }
            }
        }
    }
];

async function executeTool(toolCall) {
    const args = JSON.parse(toolCall.function.arguments);

    switch (toolCall.function.name) {
        case "buscar_posts":
            return await prisma.post.findMany({
                where: {
                    status: "PUBLISHED",
                    OR: [
                        {
                            title: {
                                contains: args.termino,
                                mode: "insensitive"
                            }
                        },
                        {
                            content: {
                                contains: args.termino,
                                mode: "insensitive"
                            }
                        },
                        {
                            tags: {
                                some: {
                                    name: {
                                        contains: args.termino,
                                        mode: "insensitive"
                                    }
                                }
                            }
                        }
                    ]
                },
                take: 10
            });

        case "obtener_posts":
            return await prisma.post.findMany({
                where: {
                    status: "PUBLISHED"
                },
                take: 10
            });

        default:
            throw new Error("Tool no implementada");
    }
}

module.exports = {
    executeTool,
    tools
}