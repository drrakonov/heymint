import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../ui/accordion";

const Help = () => {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-10 text-text-primary w-full max-w-3xl mx-auto">
            <Accordion
                type="single"
                collapsible
                className="w-full space-y-3"
                defaultValue="item-1"
            >
                <AccordionItem value="item-1">
                    <AccordionTrigger>What is HeyMint?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            HeyMint lets you create, schedule, and review video meetings with AI-generated summaries and meeting-aware chat.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger>How do I create a meeting?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            After logging in, click "Create Meeting." Choose an instant or scheduled meeting, then decide whether it should be free or password-protected.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                    <AccordionTrigger>How do protected meetings work?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Protected meetings require a password to join. After the meeting, only the host and people who actually participated can access its summary and chatbot.
                        </p>
                    </AccordionContent>
                </AccordionItem>


                <AccordionItem value="item-5">
                    <AccordionTrigger>Can I update my profile?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Yes, go to the profile page to update your name, profile picture, and personal information. These details help personalize your presence in meetings.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                    <AccordionTrigger>Who can access meeting insights?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Any logged-in user can access insights for a free meeting. Protected meeting insights are limited to the host and recorded participants.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                    <AccordionTrigger>How do I join a meeting?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Open a shared meeting link or select a meeting from the Meetings page. Protected meetings ask for the password before connecting.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default Help;
