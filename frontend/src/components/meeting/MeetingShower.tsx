import { useUserStore } from "@/store/userStore";
import { StreamCall, StreamTheme } from "@stream-io/video-react-sdk";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MeetingSetup from "./MeetingSetup";
import MeetingRoom from "./MeetingRoom";
import { useGetCallById } from "@/hooks/useGetCallById";
import Loader from "../subComponents/Loader";
import api from "@/lib/axios";
import toast from "react-hot-toast";


const MeetingShower = () => {
    const { id } = useParams();
    const { user } = useUserStore();
    const [isSetUpComplete, setIsSetUpComplete] = useState(false);
    const { call, isCallLoading } = useGetCallById(id ?? "");
    const navigate = useNavigate();
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [summary, setSummary] = useState("");



    const uploadMeetingRecording = async (blob : Blob) => {
        try {
            const userId = call?.state.createdBy?.id;
            if(!blob || !userId) {
                throw new Error("Recording Failed!");
            }
            const formData = new FormData();

            formData.append("audio", blob, "recording.webm");

            formData.append("userId", userId);

            const response = await api.post(`/api/meeting/summarize/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            });
            const summaryRes = response.data.message;
            console.log(summaryRes);
            if(summaryRes) {
                setSummary(summaryRes);
                toast.success(summaryRes);
                console.log(summaryRes);
            }
        }catch(err) {
            console.error("Failed to send recording! ", err);
        }
    }

    const startRecordMeeting = async () => {
        try {
            if(!user || !call || user.id != call.state.createdBy?.id) {
                return;
            }
            toast.success("Recoding started!");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            //Initialize the MediaRecorder with audio stream
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []; //clear the previous recordings

            //Handle chunks as they become available
            mediaRecorder.ondataavailable = (event) => {
                if(event.data && event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            };

            // Create final audio file when recording stops
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                console.log(audioBlob);

                uploadMeetingRecording(audioBlob);

                //Stop all tracks to turn off the microphone light indicator
                stream.getTracks().forEach((track) => track.stop());
            };


            //Begin the recording process
            mediaRecorder.start();
            setIsRecording(true);

        }catch(err) {
            console.error("Error accessing microphone or starting recording: ", err);
            toast.error("Could not access mircorphone");
        }
    }


    //Stop Recording meeting
    const stopRecordingMeeting = () => {
        if (mediaRecorderRef.current && isRecording) {
            toast.success("Recoding stopped!");
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if(isSetUpComplete) {
            startRecordMeeting();
        } else {
            stopRecordingMeeting();
        }

        return () => {
            stopRecordingMeeting();
        };
    }, [isSetUpComplete]);



    useEffect(() => {
        const validateAccess = async () => {
            if(!user) {
                navigate("/dashboard");
                return;
            }
            const access = await api.get("/api/meeting/validate-access", {
                params: {
                    userId: user.id,
                    meetingCode: id
                }
            });

            console.log("its", access.data.success);

            if (!access.data.success) {
                navigate("/dashboard");
                return;
            }
        }
        validateAccess();
        setIsSetUpComplete(false);
    }, [id]);

    if (isCallLoading || !user) return <Loader />;
    if (!call) return (
        <p className="text-center text-3xl font-bold text-white">
            Call Not Found
        </p>
    );

    return (
        <main className="h-screen w-full">
            <StreamCall call={call}>
                <StreamTheme>
                    {!isSetUpComplete ? (
                        <MeetingSetup setIsSetUpComplete={setIsSetUpComplete} />
                    ) : (
                        <MeetingRoom />
                    )}
                </StreamTheme>
            </StreamCall>
        </main>
    );
};

export default MeetingShower;