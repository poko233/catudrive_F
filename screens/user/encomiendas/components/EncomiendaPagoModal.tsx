import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Encomienda, TipoPago } from "../types/encomienda.types";

export function EncomiendaPagoModal({visible,encomienda,saving,onClose,onConfirm}:{
  visible:boolean; encomienda:Encomienda|null; saving:boolean; onClose:()=>void;
  onConfirm:(tipo:TipoPago)=>Promise<boolean>;
}) {
  const [tipo,setTipo]=useState<TipoPago|undefined>();
  useEffect(()=>{if(visible)setTipo(undefined)},[visible]);
  if(!encomienda)return null;
  return <Modal visible={visible} title={`Cobrar ${encomienda.guia??"encomienda"}`} onClose={onClose}>
    <View style={styles.body}>
      <ThemedText>Esta encomienda fue registrada para pago en destino.</ThemedText>
      <View style={styles.total}><ThemedText style={styles.label}>Total a cobrar</ThemedText><ThemedText style={styles.amount}>Bs {Number(encomienda.total).toFixed(2)}</ThemedText></View>
      <Select<TipoPago> label="Método de pago *" value={tipo} onValueChange={setTipo}
        options={[{value:"Efectivo",label:"Efectivo"},{value:"QR",label:"QR"},{value:"Transferencia",label:"Transferencia"}]}
        placeholder="Seleccionar método"/>
      <View style={styles.actions}><Button title="Cancelar" variant="secondary" onPress={onClose} disabled={saving}/>
        <Button title="Confirmar cobro" loading={saving} disabled={!tipo} onPress={()=>{if(tipo)void onConfirm(tipo)}}/></View>
    </View>
  </Modal>;
}
const styles=StyleSheet.create({body:{gap:16},total:{gap:4},label:{fontSize:12,opacity:.65},amount:{fontSize:26,fontWeight:"900"},actions:{flexDirection:"row",justifyContent:"flex-end",gap:8,flexWrap:"wrap"}});
