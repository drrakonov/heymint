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
                            HeyMint is a platform that lets you create, schedule, and manage both free and paid meetings with ease. Whether you're a coach, educator, or professional, HeyMint simplifies hosting and monetizing your time.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                    <AccordionTrigger>How do I create a meeting?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            After logging in, go to the dashboard and click on "Create Meeting". You can choose between an instant meeting or schedule one for later. Set the meeting title, type (free or paid), and meeting time.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                    <AccordionTrigger>How do paid meetings work?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Paid meetings allow hosts to charge attendees. Users must purchase access before joining the meeting. Payments are securely processed, and only verified buyers can join the session.
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
                    <AccordionTrigger>What if I miss a meeting?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            Missed meetings won’t be refunded automatically. If a meeting was recorded (feature coming soon), you may be able to request access to the recording from the host.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-7">
                    <AccordionTrigger>How do I join a meeting?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                        <p>
                            If you've created or purchased access to a meeting, you’ll find it under “My Meetings.” Click "Join" when the meeting is live. You can also join instant meetings directly from a shared link.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default Help;
