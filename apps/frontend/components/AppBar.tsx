export const AppBar = () => {
    return (
        <div className="flex flex-row justify-between items-center h-14 px-4 bg-black text-white">
 
            <div className="flex items-center w-1/3">
                <div className="h-8 w-8 mr-2">
                    <img src="/video-camera.png" alt="video-camera" />
                </div>
                <span className="text-xl font-semibold pl-2">p2p-meet</span>
            </div>

            <div className="flex items-center space-x-4">
                <button className="px-4 py-1 bg-blue-600 rounded-md hover:bg-blue-500">Login</button>
                <div className="p-2 rounded-full bg-gray-700 hover:bg-gray-600">
                    <UserIcon />
                </div>
            </div>
        </div>
    );
};

const UserIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#ffffff"} fill={"none"} {...props}>
      <path d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);
