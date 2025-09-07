"use client"
import ThreeScene from "@/plain"
import { useEffect, useRef } from "react"

const page = () => {

  const audioRef=useRef();


  useEffect(()=>{
    if(typeof window!=="undefined"){
      let audiobg=new Audio("/bg-audio.mp3");
      audiobg.onloadeddata=()=>{
        audiobg.volume=0.5;
        audiobg.play()
      }

      document.addEventListener("mousemove",()=>{
        audiobg.volume=0.5;
        if(audiobg?.paused)
          audiobg?.play();
      })
    }
  },[])
  
  
  
  
    return (
    <div className="party-canvas">
       <ThreeScene/>
    </div>
  )
}

export default page