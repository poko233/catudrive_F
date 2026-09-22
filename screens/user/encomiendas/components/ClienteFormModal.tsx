import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { clienteService } from "../services/cliente.service";
import { Cliente } from "../types/encomienda.types";

export function ClienteFormModal({ visible, onClose, onCreated }: {
  visible:boolean; onClose:()=>void; onCreated:(cliente:Cliente)=>void;
}) {
  const [nombres,setNombres]=useState("");
  const [paterno,setPaterno]=useState("");
  const [materno,setMaterno]=useState("");
  const [ci,setCi]=useState("");
  const [telefono,setTelefono]=useState("");
  const [saving,setSaving]=useState(false);

  useEffect(()=>{ if(visible){ setNombres("");setPaterno("");setMaterno("");setCi("");setTelefono(""); }},[visible]);

  const guardar=async()=>{
    if(!nombres.trim() || !paterno.trim()){
      Toast.show({type:"error",text1:"Datos incompletos",text2:"Nombres y apellido paterno son obligatorios."}); return;
    }
    setSaving(true);
    try{
      const c=await clienteService.crear({
        nombres:nombres.trim(), apellido_paterno:paterno.trim(),
        apellido_materno:materno.trim()||null, ci:ci.trim()||null, telefono:telefono.trim()||null,
      });
      Toast.show({type:"success",text1:"Cliente registrado"});
      onCreated(c);
    }catch(e:any){
      Toast.show({type:"error",text1:"No se pudo registrar",text2:e?.message||"Revisa los datos del cliente."});
    }finally{setSaving(false);}
  };

  return <Modal visible={visible} title="Nuevo cliente" onClose={onClose}>
    <View style={styles.body}>
      <Input label="Nombres *" value={nombres} onChangeText={setNombres} />
      <View style={styles.row}>
        <View style={styles.flex}><Input label="Apellido paterno *" value={paterno} onChangeText={setPaterno}/></View>
        <View style={styles.flex}><Input label="Apellido materno" value={materno} onChangeText={setMaterno}/></View>
      </View>
      <View style={styles.row}>
        <View style={styles.flex}><Input label="CI" value={ci} onChangeText={setCi}/></View>
        <View style={styles.flex}><Input label="Teléfono" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad"/></View>
      </View>
      <View style={styles.actions}>
        <Button title="Cancelar" variant="secondary" onPress={onClose} disabled={saving}/>
        <Button title="Guardar cliente" onPress={()=>void guardar()} loading={saving}/>
      </View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({body:{gap:12},row:{flexDirection:"row",flexWrap:"wrap",gap:12},flex:{flex:1,minWidth:180},actions:{flexDirection:"row",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}});
