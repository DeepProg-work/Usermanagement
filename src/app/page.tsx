// app/page.tsx
"use client";

import { useSession } from "next-auth/react";
import ThreeScene from "./components/threeJs/firstexample";
import  GsapSortingVisualizer  from "./components/gsap/Sorting/page";
import ArrayOperationsVisualizer from "./components/gsap/array/page";





export default  function Home() {
  
    

         const { data: session,update } = useSession();
    
  
       const sessionstatus = session ? "Session is active" : "Session is not active";
    

    if (!session) {
  return (
   <div>
       
     
        <section className="bg-gray-100 py-20">
       
    
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Welcome to Our Product</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8"> {sessionstatus}</p>

<ArrayOperationsVisualizer />
<GsapSortingVisualizer />

        </div>
      </section>
      {/* Features Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature One</h3>
              <p className="text-gray-600">Description of the first feature in a concise manner.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature Two</h3>
              <p className="text-gray-600">Description of the second feature in a concise manner.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature Three</h3>
              <p className="text-gray-600">Description of the third feature in a concise manner.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Our Users Say</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">"This product changed the way we work. Highly recommend!"</p>
              <p className="text-gray-800 font-semibold">John Doe, CEO</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">"Amazing support and easy to use. A game-changer!"</p>
              <p className="text-gray-800 font-semibold">Jane Smith, Developer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">© 2025 Your Company. All rights reserved.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Contact Us</a>
          </div>
        </div>
      </footer>      </div>
     );}
   else{
     return (
      <div>
       
     
        <section className="bg-gray-100 py-20">
       
    
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Welcome to Our Product</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8"> {sessionstatus}</p>
        <p>Welcome, {session?.user?.name}!</p>
        <p>Role: {session.user?.role}</p>
        <ThreeScene />


   
       
        </div>
      </section>
      {/* Features Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature One</h3>
              <p className="text-gray-600">Description of the first feature in a concise manner.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature Two</h3>
              <p className="text-gray-600">Description of the second feature in a concise manner.</p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feature Three</h3>
              <p className="text-gray-600">Description of the third feature in a concise manner.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="bg-gray-100 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">What Our Users Say</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">"This product changed the way we work. Highly recommend!"</p>
              <p className="text-gray-800 font-semibold">John Doe, CEO</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">"Amazing support and easy to use. A game-changer!"</p>
              <p className="text-gray-800 font-semibold">Jane Smith, Developer</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-4">© 2025 Your Company. All rights reserved.</p>
          <div className="flex justify-center space-x-4">
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400">Terms of Service</a>
            <a href="#" className="hover:text-gray-400">Contact Us</a>
          </div>
        </div>
      </footer>      </div>
    );

  }

  }
