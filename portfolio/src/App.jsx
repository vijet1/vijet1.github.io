import { useState } from 'react'
import './index.css'

const STORAGE_KEY = "WeightedBucketList";
const MAX_WEIGHT = 10;
const MIN_WEIGHT = 0;

const CAUTION_COLOR = 3;
const GOOD_COLOR = 1;
const BAD_COLOR = 4;
const MEH_COLOR = 2;

function updateStorage(data){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getStorage(){
  let store = localStorage.getItem(STORAGE_KEY);
  if (store){
    return JSON.parse(store)
  }

  return {categories: {
      ["People"]: {Order: 0, Color: GOOD_COLOR},
      ["Decisions"]: {Order: 1, Color: BAD_COLOR},
      ["Tasks"]: {Order: 2, Color: MEH_COLOR},
      ["Bucket List"]: {Order: 3, Color: MEH_COLOR},
      ["Do Again"]: {Order: 4, Color: CAUTION_COLOR},
      ["Ideas"]: {Order: 5, Color: CAUTION_COLOR},
      ["Purchase"]: {Order: 6, Color: CAUTION_COLOR},

      ["Helpful"]: {Order: 7, Color: GOOD_COLOR},
      ["Excitment"]: {Order: 8, Color: MEH_COLOR},
      ["Investment"]: {Order: 9, Color: CAUTION_COLOR},
      ["Cool"]: {Order: 10, Color: BAD_COLOR},
  }, items: {
    
  }}
}

function setTabHeader(iconLink, title){
  if (iconLink){
    const favicon = document.querySelector("link[rel='icon']");
    favicon.href = iconLink;
  }

  if (title){
    document.title = title;
  }
}
setTabHeader("/assets/rose.png", "Weighted Bucket List");

function ListItem({name, weight, color}){
  const normalized = (weight - MIN_WEIGHT) / (MAX_WEIGHT - MIN_WEIGHT);
  const clamped = Math.max(0, Math.min(1, normalized));
  const percent = clamped * 100;

  return (
    <div className='listItem' style={{borderColor: color}}>
      <h3>
        {name}
      </h3>
      <div className='fillBarBG'>
        <div className='fillBar' style={{width: `${percent}%`, background: color}} />
      </div>
    </div>
  )
}

function List({name, items, color}){
  color = `var(--hue${color})`
  let listItems = [];
  for (let i = 0; i < items.length; i++){
    listItems[i] = <ListItem name={items[i][0]} weight={items[i][1]} key={items[i][0]} color={color} />
  }

  return (
    <div className='list'>
      <h2>
        {name}
      </h2>
      {listItems}
    </div>
  );
}

function CmdLine({categories, itemComplete}){
  let [addingItem, updateAddingItem] = useState({});
  let [step, updateStep] = useState(-1);
  let [inputValue, setInputValue] = useState("");
  
  let catNames = [];
  for (const [catName, catData] of Object.entries(categories)){
    catNames[catData.Order] = catName;
  }

  function keydown(input){
    if (input.key == "Enter"){
      input = input.target.value;

      let newAddingItem = {...addingItem};
      if (step == -1){
        newAddingItem["__Name"] = input;
      }else{
        newAddingItem[catNames[step]] = input;
      }

      if (step == catNames.length - 1){
        itemComplete(newAddingItem);
        updateAddingItem({});
        updateStep(-1);
      } else{
        updateAddingItem(newAddingItem);
        updateStep(step + 1);
      }

      setInputValue("")
    }
  }

  function checkString(input){
    input = input.target.value;
    if (step == -1){
      setInputValue(input)
    }else{
      if (/^\d+$/.test(input) && Number(input) <= 10 && Number(input) >= 0){
        setInputValue(input)
      }
    }
  }

  let finished = [];
  if (addingItem["__Name"]){
    finished[finished.length] = <span className="CMD" key={-1}> {addingItem["__Name"]} </span>
  }

  for (let i = 0; i < catNames.length; i++) {
    let weight = addingItem[catNames[i]]
    if (weight !== undefined) {
      let catData = categories[catNames[i]];
      finished[finished.length] = <span className="CMD" key={catData.Order} style={{color: `var(--hue${catData.Color})`}}> {weight} </span>
    }else{
      break;
    }
  }

  const styleInput = step == -1 ? {} : {color: `var(--hue${categories[catNames[step]].Color})`};
  const pltext = step == -1 ? "Add Item..." : catNames[step] + " (0-10)";

  return(
    <div className="textInputDiv">
      <div className="cmdLeft">
        {finished}
      </div>
      <input type="text" placeholder={pltext} style={styleInput} spellCheck='false' onKeyDown={keydown} onChange={checkString} value={inputValue}/>
      <div style={{ flex: 1 }} />
    </div>
  );
}

function App() {
  const [storedData, setData] = useState(() => {
    return getStorage()
  });
  function updateData(newData) {
    setData(newData);
    updateStorage(newData);
  }

  let categories = [];
  for (const [catName, catData] of Object.entries(storedData.categories)){
    let items = [];
    for (const [label, labelData] of Object.entries(storedData.items)){
      let weight = labelData[catName];
      if (weight > 0) items.push([label, weight]);
    }
    items.sort((a, b) => b[1] - a[1]);

    categories[catData.Order] = <List name={catName} items={items} key={catName} color={catData.Color}/>;
  }

  function onItemComplete(info){
    info = {...info}
    let newItems = {...storedData.items};
    newItems[info["__Name"]] = info;
    info["__Name"] = undefined;
    let newData = {categories: storedData.categories, items: newItems};
    updateData(newData);
  }

  return (
    <>
      <h1>
        SUPER LIST
      </h1>
        <CmdLine categories={storedData.categories} itemComplete={onItemComplete}/>
      <hr/>
      <div className='listParent'>
        {categories}
      </div>
    </>
  );
}

export default App
