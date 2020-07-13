(function () {
  var view;
  var mol;
  const Molecule=App.Molecule;
  const Display=App.Display;

function getFormVal(){
    //gets values for probe options from document form
    const z_dist=parseFloat(document.getElementById("z_dist").value);
    const z_num=parseInt(document.getElementById("z_num").value);
    const x_dist=parseFloat(document.getElementById("x_dist").value);
    const x_num=parseInt(document.getElementById("x_num").value);
    const y_dist=parseFloat(document.getElementById("y_dist").value);
    const y_num=parseInt(document.getElementById("y_num").value);
    return [z_num, z_dist, x_num, x_dist, y_num, y_dist];
}
const input = document.querySelectorAll('input');
input.forEach((item)=>{
    //update probes whenever form value is changed
     item.addEventListener('input', updateProbe);

})

//open molecule from homepage
const homefile=document.getElementById('homefile');
homefile.addEventListener('change', openMolecule);

//update ring button connection
const update=document.getElementById('top-button-run');
update.addEventListener('click', updateRing);

async function updateRing(){

     //updates geometry of molecule in viewer using selected atoms as center

      const reducer = (accumulator, currentValue) => accumulator.toString() +' '+ currentValue.toString();
      if(view.viewer.rings.length<=2){
          alert("Ring must be defined by three or more atoms.");
          return;
      }
      $("#loading-run").show();
      $("#top-button-run").hide();

      //condense array into string to simplify request
      mol.rings=view.viewer.rings.reduce(reducer);

      mol.opened=false;
      const res=await mol.readFile();

      mol.rawData=res.data[0];
      mol.inputFile=res.data['text'][0];
      view=new Display(mol);
      view.render();
      view.displayText();
      view.addProbes();
      $("#loading-run").hide();
      $("#top-button-run").show();
      mol.opened=true;
}

async function openMolecule(input){
    //open molecule given file input

    //copy already opened molecule in case opening new molecule fails
    const molCopy=mol;

    $("#send-button,#top-button-open").hide();
    $("#loading,#loading-open").show();
    mol=new Molecule(input.target.files[0]);
    const res=await mol.readFile();

    if(res==="error"){
        alert("Unable to open molecule");
        $("#send-button,#top-button-open").show();
        $("#loading,#loading-open").hide();
        mol=molCopy;
        return}
    //update molecule data from response
    mol.rawData=res.data[0];
    mol.inputFile=res.data['text'][0];
    view=new Display(mol);

    $("#homediv,#loading-open").hide();
    $("#main,#top-button-open").show();
    //display molecule, text, and probes
    view.render();
    view.displayText();
    view.addProbes();
    mol.opened=true;
}
function updateProbe(input){
    //updates probes if changed input field is populated
    if (input.target.value.length>0){
    view.addProbes();
    }
}

const fileDownloadButton=document.getElementById("download")
function download(){
    //create download link for text field
    let text = document.getElementById("text-field").value;
    text = text.replace(/\n/g, "\r\n"); // To retain the Line breaks.
    const blob = new Blob([text], { type: "text/plain"});
    const anchor = document.createElement("a");
    anchor.download = `${mol.file.name.slice(0,-4)}_ring1.com`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.target ="_blank";
    anchor.style.display = "none"; // just to be safe!
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
 }
// file download button event listener
fileDownloadButton.addEventListener('click', download);
})();
