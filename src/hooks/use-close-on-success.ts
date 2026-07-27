"use client";

import { useEffect } from "react";

/**
 * Fecha o dialog quando uma Server Action (via useFormState) reporta sucesso.
 *
 * Usa useEffect de propósito — chamar `onSuccess` (que atualiza o estado do
 * componente PAI, ex.: `setOpen(false)`) diretamente durante a renderização
 * do filho quebra as regras do React ("Cannot update a component while
 * rendering a different component", confirmado em runtime). O ajuste de
 * estado durante a renderização só é seguro para o estado do PRÓPRIO
 * componente; para notificar um pai a partir de uma mudança vinda de fora
 * (aqui, o resultado de uma Server Action — um sistema externo), o efeito é
 * o padrão correto, não um workaround.
 *
 * Só é seguro contra "segundo sucesso não fecha de novo" porque o componente
 * que chama este hook é filho de `DialogContent`, que desmonta quando o
 * dialog fecha (Radix) — cada abertura recomeça com `state.success` do zero.
 */
export function useCloseOnSuccess(success: boolean | undefined, onSuccess: () => void) {
  useEffect(() => {
    if (success) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSuccess é recriada a cada render do pai (arrow function inline); só queremos reagir à mudança de `success`.
  }, [success]);
}
