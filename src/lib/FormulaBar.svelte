<script>
  let { wb } = $props()

  const text = $derived.by(() => {
    wb.rev
    return wb.edit ? wb.edit.text : wb.raw(wb.sel.ar, wb.sel.ac)
  })

  function onfocus() {
    if (!wb.edit) wb.startEdit('bar', text)
  }

  function oninput(e) {
    if (!wb.edit) wb.startEdit('bar', '')
    wb.edit.text = e.currentTarget.value
  }

  function onkeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      wb.commitEdit(1, 0)
      wb.focusGrid()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      wb.cancelEdit()
      wb.focusGrid()
    }
  }

  function onblur() {
    if (wb.edit?.mode === 'bar') wb.commitEdit()
  }
</script>

<div class="fbar card">
  <span class="chip tn addr">{wb.label}</span>
  <span class="fx" aria-hidden="true">fx</span>
  <input
    class="inp"
    type="text"
    spellcheck="false"
    autocomplete="off"
    aria-label="Conteúdo da célula"
    value={text}
    {onfocus}
    {oninput}
    {onkeydown}
    {onblur}
  />
</div>

<style>
  .fbar {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 36px;
    padding: 0 8px 0 7px;
    border-radius: 100px;
  }

  .addr {
    min-width: 56px;
    justify-content: center;
    border-radius: 100px;
    height: 24px;
  }

  .fx {
    font: 400 15px / 1 var(--serif);
    color: var(--fg-4);
  }

  .inp {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: 0;
    outline: 0;
    background: none;
    font: 400 13px / 1 var(--sans);
  }
</style>
