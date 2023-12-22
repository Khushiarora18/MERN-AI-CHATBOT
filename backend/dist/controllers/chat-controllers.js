import User from "../models/User.js";
import { configureOpenAI } from "../config/openai-config.js";
export const generateChatCompletion = async (req, res, next) => {
    const { message } = req.body;
    try {
        const user = await User.findById(res.locals.jwtData.id);
        if (!user)
            return res
                .status(401)
                .json({ message: "User not registered OR Token malfunctioned" });
        // grab chats of the user
        const chats = user.chats.map(({ role, content }) => ({
            role,
            content,
        }));
        chats.push({ content: message, role: "user" });
        user.chats.push({ content: message, role: "user" });
        // send all chats with the new one to OpenAI API
        const openai = configureOpenAI();
        // get the latest response
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: chats,
        });
        if (completion.choices && completion.choices.length > 0) {
            user.chats.push({
                content: completion.choices[0].message.content,
                role: "assistant",
            });
            await user.save();
            return res.status(200).json({ chats: user.chats });
        }
        else {
            // Handle the case where completion.choices is undefined or empty
            return res.status(500).json({ message: "No valid response from OpenAI" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
// ... (other controller functions remain unchanged)
export const sendChatsToUser = async (req, res, next) => {
    try {
        // user token check
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).send("User not registered OR Token malfunctioned");
        }
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        return res.status(200).json({ message: "OK", chats: user.chats });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
export const deleteChats = async (req, res, next) => {
    try {
        // user token check
        const user = await User.findById(res.locals.jwtData.id);
        if (!user) {
            return res.status(401).send("User not registered OR Token malfunctioned");
        }
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Permissions didn't match");
        }
        //@ts-ignore
        user.chats = [];
        await user.save();
        return res.status(200).json({ message: "OK" });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};
//# sourceMappingURL=chat-controllers.js.map