import React, { useState, useContext } from "react";
import "../styles/authentication.css";
import { AuthContext } from "../contexts/AuthContext";

export default function Authentication(){

const [username,setUsername]=useState("");
const [password,setPassword]=useState("");
const [name,setName]=useState("");

const [error,setError]=useState("");
const [message,setMessage]=useState("");

const [formState,setFormState]=useState(0);

const {handleRegister,handleLogin} =
useContext(AuthContext);

const handleAuth = async ()=>{

 try{

   if(formState===0){
      await handleLogin(
         username,
         password
      );

   }

   if(formState===1){

      let result=
      await handleRegister(
         name,
         username,
         password
      );

      setMessage(result);
      setFormState(0);

      setName("");
      setUsername("");
      setPassword("");
      setError("");
   }

 }
 catch(err){
   setError(
    err?.response?.data?.message ||
    "Something went wrong"
   );
 }

};

return(
<div className="auth-page">

  <div className="auth-left">
      <div className="overlay">
         <h1>QuickMeet</h1>
         <p>
           Secure Real-Time
           Video Collaboration
         </p>
      </div>
  </div>


  <div className="auth-right">

      <div className="auth-card">

         <div className="lock-icon">
            🔒
         </div>

         <h2>
           {formState===0
            ? "Welcome Back"
            : "Create Account"}
         </h2>

         <div className="tabs">

            <button
             onClick={()=>setFormState(0)}
             className={
               formState===0
               ? "active"
               : ""
             }
            >
              Sign In
            </button>

            <button
             onClick={()=>setFormState(1)}
             className={
               formState===1
               ? "active"
               : ""
             }
            >
              Sign Up
            </button>

         </div>


         <div className="form">

           {formState===1 && (
             <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e)=>
                setName(
                 e.target.value
                )
              }
             />
           )}

           <input
             type="email"
             placeholder="Username"
             value={username}
             onChange={(e)=>
               setUsername(
                 e.target.value
               )
             }
           />

           <input
             type="password"
             placeholder="Password"
             value={password}
             onChange={(e)=>
               setPassword(
                 e.target.value
               )
             }
           />

           <p className="error">
             {error}
           </p>

           <button
             className="submit-btn"
             onClick={handleAuth}
           >
             {formState===0
              ? "Login"
              : "Register"}
           </button>

           {message && (
             <p className="success">
                {message}
             </p>
           )}

         </div>

      </div>

  </div>
</div>

);
}