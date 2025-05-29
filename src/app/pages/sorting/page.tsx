import BubbleSortVisualizer from "@/components/threeJs/bubblesort";
import ThreeScene from "@/components/threeJs/firstexample";
import InsertionSortVisualizer from "@/components/threeJs/insertionsort";
import MergeSortVisualizer from "@/components/threeJs/mergesort";
import SelectionSortVisualizer from "@/components/threeJs/selectionsort";

import  getServerSession  from "next-auth"

export default  function Home() {
  
    

    
  
     return (
      <div>
       
     
        <section className="bg-gray-100 py-20">
       
    
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Sorting Algorithms</h1>

        <BubbleSortVisualizer></BubbleSortVisualizer>
        <InsertionSortVisualizer></InsertionSortVisualizer>
        <SelectionSortVisualizer></SelectionSortVisualizer>
        <MergeSortVisualizer></MergeSortVisualizer>


   
       
        </div>
      </section></div>);}
  