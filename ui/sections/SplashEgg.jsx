"use client"
import img from "../../public/banner-img.png";
import Image from "next/image";
import splashEggEffect from "../../public/egg.png";
import { useEffect, useRef, useState } from "react";
import baloonImG from "../../public/Baloon.png";

const SplashEgg=()=>{

const ref=useRef();
const [eggsSmashed,setEggsSmashed]=useState(0)
const audioRef=useRef();
const cheeringAudioRef=useRef();



useEffect(()=>{
  audioRef.current=new Audio(`/splash-sound.mp3`);
  cheeringAudioRef?.current=new Audio(`/applause.mp3`)
},[])

const baloons = Array?.from({ length: 40 }, (_, index) => {
    return (
      <Image
        src={baloonImG}
        height={100}
        width={100}
        className="position-absolute object-fit-cover"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          opacity:0,
          zIndex: 1,
          animation: `baloons-up 3s ${index*0.1}s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite`,
        }}
      />
    );
  });



 const eggSplash=(e)=>{
if(ref.current&&audioRef?.current&&cheeringAudioRef?.current){
    
    let eggSplashElement=document.createElement("img");
    eggSplashElement.src=splashEggEffect?.src;
    eggSplashElement.height=50;
    eggSplashElement.width=100;
    eggSplashElement.className="object-fit-contain";
    eggSplashElement.style.position='absolute';
    eggSplashElement.style.left = `${e.clientX - eggSplashElement.width / 2}px`;
    eggSplashElement.style.top = `${e.clientY - eggSplashElement.height / 2}px`;
    eggSplashElement.style.animation=`scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) 1`
    ref.current.appendChild(eggSplashElement)
    audioRef.current=new Audio('/splash-sound.mp3');
    audioRef?.current?.play()
    if(eggsSmashed===4){
        cheeringAudioRef.current.volume=0.5;
cheeringAudioRef?.current?.play()
    }
   if(eggsSmashed!==5){
    setEggsSmashed((prev)=>prev+1);
   }

    setTimeout(()=>{
        ref.current.removeChild(eggSplashElement);
    },2000)
}
 }


    return <div className="page-section" ref={ref} >
        {eggsSmashed===5&&baloons}
        <div>
        <h2 className="title text-center mb-3">Splash Some Eggs</h2>
        <h4 className="subtitle text-center mb-3 ">Time to throw some eggs on birthday boy</h4>
     <Image onClick={(e)=>eggSplash(e)} src={img}  height={700} className="full-width object-fit-contain" alt="birthday-boy"/>
        </div>

    </div>


}
export default SplashEgg;
