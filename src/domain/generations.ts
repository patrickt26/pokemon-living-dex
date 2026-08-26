export const generationRanges=[[1,151],[152,251],[252,386],[387,493],[494,649],[650,721],[722,809],[810,905],[906,1025]] as const;
export const generationOptions=[{id:'all',label:'All'},...generationRanges.map((_,index)=>({id:String(index+1),label:String(index+1)}))];
export function isInGeneration(nationalDexNumber:number,generation:string){if(generation==='all')return true;const range=generationRanges[Number(generation)-1];return range?nationalDexNumber>=range[0]&&nationalDexNumber<=range[1]:true}
