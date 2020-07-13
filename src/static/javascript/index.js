App={

Molecule:function (file){
    //constructor function for molecules
    this.file=file;
    this.rawData='';
    this.rings=[];
    this.inputFile='';
    this.opened=false;

    this.readFile = async function(){
        //sends user inputted file to server
        //returns molecule with aligned geometry
        let form = new FormData();
        form.append('rings',this.rings);
        form.append('file', this.file);

        try{const res=await axios({
              method: 'POST',
              url: '/process-file',
              data: form,
              headers: {'Content-Type': 'multipart/form-data' },

          });
          return res;
      }
       catch(err){
           return"error";
       }


       }

     this.generateProbes=function (z_num=1, z_dist=1, x_num=0,
         x_dist=1, y_num=0, y_dist=1){
         //generates and returns all probe coordinates from given inputted values

         //creates cartesian product from 1 dimensional coordinates
         const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
         const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

         function flatCoords(num,dist){
             //generates 1 dimensional coordintates given number of probes and
             //distance between probes

           let length=2*num+1;
           let coords= new Array(length);
            coords[num]=0;
             if(num==0){return [0]}
             else{
                for(let i=1;i<(num+1);i++){
                 coords[num-i]=-dist*i;
                 coords[num+i]=dist*i;
               }
             }
             return coords;
         }
         return cartesian(flatCoords(x_num,x_dist),flatCoords(y_num,y_dist),flatCoords(z_num,z_dist));
       }


   },

Display:function (molecule){
    //constructor function for displaying molecule and text field
    this.viewer=1;
    this.molecule=molecule;
    this.labels=[];
    this.atoms=[];


    this.displayText=function (){
     $("#text-field").val(this.molecule.inputFile)
    }
    this.render= function(){
          //renders molecule into viewer

          //create viewer
          this.viewer = $3Dmol.createViewer("gldiv", {
            defaultcolors : $3Dmol.rasmolElementColors
          });
          this.viewer.setBackgroundColor(0x000000);
          this.viewer.rings=[];

          //add molecue to viewer
          let receptorModel = this.viewer.addModel(this.molecule.rawData, "pqr");

          const atoms = receptorModel.selectedAtoms({});

          //add callback function handle click selection for all atoms in
          //molecule
          for ( const i in atoms) {

            let atom = atoms[i];
            atom.clickable = true;
            atom.callback =function callback(molecule=this.molecule,viewer=this.viewer){

                    if (this.clickLabel === undefined
                        || !this.clickLabel instanceof $3Dmol.Label) {
                      this.clickLabel = viewer.addLabel(this.elem + this.serial, {
                        fontSize : 14,
                        position : {
                          x : this.x,
                          y : this.y,
                          z : this.z
                        },
                        backgroundColor: "black"
                      });
                      this.clicked = true;
                      //add index of clicked atom to ring array
                      viewer.rings.push(this.index)
                    }

                    else {
                        //remove from ring array and remove label when already
                        //clicked atom is clicked again
                        viewer.removeLabel(this.clickLabel);
                        delete this.clickLabel;
                        viewer.rings=viewer.rings.filter(entry=>entry!=this.index);
                        this.clicked = false;

                    }
                };
          }

          this.viewer.mapAtomProperties($3Dmol.applyPartialCharges);
          this.viewer.setStyle({},{stick:{}});


          this.viewer.zoomTo();
          this.viewer.render();

    }
    this.addProbes=function(){
        //adds probes to viewer
        const z_dist=parseFloat(document.getElementById("z_dist").value);
        const z_num=parseInt(document.getElementById("z_num").value);
        const x_dist=parseFloat(document.getElementById("x_dist").value);
        const x_num=parseInt(document.getElementById("x_num").value);
        const y_dist=parseFloat(document.getElementById("y_dist").value);
        const y_num=parseInt(document.getElementById("y_num").value);

        const probeCount=y_num*x_num*z_num;

        if(probeCount > 3000){alert('maximum number of probes is 26,000');return;}
        if(this.molecule.opened){this.viewer.getModel().hide()}

        //generate the probes
        const coords=this.molecule.generateProbes(z_num, z_dist, x_num,
            x_dist, y_num, y_dist);

        //get and strip probe values from text field
        let new_str=$("#text-field").val()

        if( new_str.indexOf('bq')!=-1){
           new_str= $("#text-field").val().split("bq")[0];
        }
        $("#text-field").val(new_str);
        let atoms=[];
        function formatNumber(number){
            //formats whitespace and coordinates for probes

            let outputString=number.toFixed(8).toString();

            if (number<0){
                outputString=outputString.substring(0,11);
                return `      ${outputString}`
            }
            else{
                outputString=outputString.substring(0,10);
                return `       ${outputString}`
            }

        }
        coords.forEach((item)=>{
            //create array of all probe pseudoelements from coordinates
        atoms.push({elem: 'O', x: item[0], y: item[1], z: item[2],singleBonds:true,  bonds: [0]})
    });

        this.viewer.setBackgroundColor(0x000000);

        //create and style model for probes
        let probeModel = this.viewer.addModel();
        probeModel.addAtoms(atoms);
        probeModel.setStyle({},{sphere:{color:"green",hidden:false,radius:0.1255}});
        let tempString='';
        //update viewer to include probe
        this.viewer.render();

        //add formatted probe coordinates to temporary string
        coords.forEach((item)=>{tempString+=`bq${formatNumber(item[0])} ${formatNumber(item[1])} ${formatNumber(item[2])} \n`});

        //add temporary string to text field
        $("#text-field").val($("#text-field").val()+tempString)




    }



  }

}
