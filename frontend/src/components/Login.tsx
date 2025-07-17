import { AuthBotton } from "./subComponents/AuthButton"
import { BottomWarning } from "./subComponents/BottomWarning"
import { Heading } from "./subComponents/Heading"
import { InputBox } from "./subComponents/InputBox"
import PasswordInput from "./subComponents/PasswordInput"
import { SubHeading } from "./subComponents/SubHeading"

const Login = () => {

    return <div className="bg-background h-screen flex justify-center">
    <div className="flex flex-col justify-start mt-35">
      <div className="rounded-lg bg-background w-20vh text-center p-2 h-max px-4">
        <Heading label={"Login to heyMint"} />
        <SubHeading label={"Enter your credentials to access your account"} />
        <InputBox placeholder="Email" type="email"/>
        <PasswordInput />
        <div className="pt-4">
          <AuthBotton onClick={() => {}} label={"Login to heyMint"} />
        </div>
        <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/auth/signup"} />
        
      </div>
    </div>
  </div>
}

export default Login;