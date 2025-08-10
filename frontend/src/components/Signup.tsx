import { useState } from "react"
import { AuthBotton } from "./subComponents/AuthButton"
import { BottomWarning } from "./subComponents/BottomWarning"
import { Heading } from "./subComponents/Heading"
import { InputBox } from "./subComponents/InputBox"
import PasswordInput from "./subComponents/PasswordInput"
import { SubHeading } from "./subComponents/SubHeading"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Button } from "./ui/button"
import google from '@/assets/google.svg'

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { signup, handleGoogleAuth } = useAuth();

  const handleSignup = async () => {
    await signup(email, password);
    navigate("/dashboard");
  };

  


  return <div className="bg-background h-screen flex justify-center">
    <div className="flex flex-col justify-start mt-35">
      <div className="rounded-lg bg-background w-20vh text-center p-2 h-max px-4">
        <Heading label={"Signup to heyMint"} />
        <SubHeading label={"Enter your credentials to create your account"} />
        <InputBox
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <PasswordInput
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="pt-4">
          <AuthBotton onClick={handleSignup} label={"Signup to heyMint"} />
        </div>
        <BottomWarning label={"Already have an account?"} buttonText={"Log in"} to={"/auth"} />
        <Button className="w-full bg-cardbg hover:bg-cardbg/50"
          onClick={handleGoogleAuth}
        >
          <img src={google} alt="google-logo" className="w-4 md:w-6" />
          <span className="text-sm md:text-md">Continue with Google</span>
        </Button>
      </div>
    </div>
  </div>
}

export default Signup;