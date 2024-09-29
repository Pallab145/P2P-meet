"use client";

import { useState } from "react";

export const SideBar = () => {
    const [isOpen, setIsOpen] = useState(false);
  
    return (
      <div className={`flex bg-gray-800 ${isOpen ? "w-64" : "w-16"} transition-width duration-0 h-screen`}>
        <div className="flex flex-col justify-start w-full">
          <div className="flex items-center justify-between p-4">
            {isOpen && <p className="text-white text-sm">RECOMMENDED CHANNELS</p>}
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <ArrowLeftIcon /> : <ArrowRightIcon />}
            </button>
          </div>
  
          <div className={`text-white p-4 ${isOpen ? "block" : "hidden"} transition-all duration-300`}>
            <p>User 1</p>
            <p>User 2</p>
            <p>User 3</p>
            <p>User 4</p>
            <p>User 5</p>
          </div>
        </div>
      </div>
    );
}


const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#ffffff"} fill={"none"} {...props}>
    <path d="M20.0001 18L20.0001 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M16.0001 11.9995L4.00012 11.9995" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.0002 8C12.0002 8 16.0001 10.946 16.0001 12C16.0001 13.0541 12.0001 16 12.0001 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#ffffff"} fill={"none"} {...props}>
    <path d="M4 6L4 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8.00012 12.0005L20.0001 12.0005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 8C12 8 8.00001 10.946 8 12C7.99999 13.0541 12 16 12 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
