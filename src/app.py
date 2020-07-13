from flask import Flask,render_template,request,flash,redirect
from pynics import WriteFile, get_pretty_coords
import os
from pybel import readstring as _readstring

app=Flask(__name__)

ALLOWED_EXTENSIONS = set(['pdb','mol','log','mol2','com','xyz'])



def allowed_file(filename):
	return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def index():

    return render_template('index.html')



@app.route("/process-file",methods=["POST","GET"])
def upload_file():
    '''
    processes file blob from client.
    creates writeFile object from file blob to alter geometry
    sends updated geometry to client

    '''

    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No file selected for uploading')
            return redirect(request.url)
        if file and allowed_file(file.filename):


            data=file.read().decode("utf-8").replace('\\r\\n','\\n')

            mol=_readstring(file.filename.rsplit('.', 1)[1].lower(),data)
            file_geom=[]

            for atom in mol.atoms:
                file_geom.append([atom.atomicnum, *atom.coords])

            filedir=os.path.join(app.config['UPLOAD_FOLDER'], "ccs.xyz")
            obj=WriteFile((filedir,file_geom))

            if len(request.form['rings'])>2:
                print("rings")
                ring_list=[int(x)for x in request.form["rings"].split()]
                print(ring_list)
                obj.rings=[ring_list]
            geom=get_geom(obj)

            response_object={}
            response_object["text"]=[]
            if len(obj.get_probeFile_info())>0:

                response_object["probes"]=True
                for x,ring in enumerate(geom):
                    response_object["text"].append(obj.get_probeFile_info()[x][1])
                    response_object[str(x)]=pdb_str(geom[x+1],False)
            else:

                response_object["0"]=pdb_str(obj.geom,True)
                response_object["text"].append("".join(get_pretty_coords(obj.geom,True)))
                response_object["probes"]=False


            return response_object
        else:
            flash('Allowed file types are pdb,log,mol')
            return redirect(request.url)

def get_geom(obj):
    '''
    Gets geom from from writeFile Object argument
    returns dictionary of format{ring number:geometry}
    '''
    master_geom = {}
    master_probe = {}
    # get probe file geometry information
    new_object = obj.get_probeFile_info()
    print('obj',len(new_object))
    ring_num = 1
    for i in range (len(new_object)):

        # get geom of each ring
        probe_geom = new_object[i][0]
        probe_geom_list = [x.split() for x in probe_geom]
        probe_list = []
        for geom in probe_geom_list:

            # separate probes from atoms
            if geom[0] == 'bq':
                probe_list.append(geom)
                probe_geom_list.remove(geom)

        probe_list.append(probe_geom_list[-1])
        probe_geom_list = probe_geom_list[0:-1]
        final_probe_geom = []
        for index, x, y, z in probe_geom_list:
            if index != 'bq':
                final_probe_geom.append([index, float(x), float(y), float(z)])
        master_geom[ring_num] = final_probe_geom

        master_probe[ring_num] = probe_list
        ring_num += 1
    return master_geom
def pdb_str(geom,transform):
    '''
    arguments:
    geom-2d nested geom list of format[[a1,x1,y1,z1],[a2,x2,y2,z2]]
    transform-bool where true transforms atomic number to atomic symbol
    creates pdb string from geom
    '''
    from pybel import readstring as _readstring
    def xyz_maker(x):
        return '{}\n\n{}'.format(len(x.split('\n')) - 1, x)
    xyzBlock = xyz_maker(''.join(get_pretty_coords(geom, transform)))
    molecule = _readstring('xyz', xyzBlock)
    pdb_block = molecule.write('pdb')
    return pdb_block
if __name__=="__main__":

    app.run()
