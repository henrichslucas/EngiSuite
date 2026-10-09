<script>
  let { name, size = 16 } = $props()

  const paths = {
    undo: 'M6 4 3 7l3 3M3 7h6.5a3.5 3.5 0 0 1 0 7H7',
    redo: 'M10 4l3 3-3 3M13 7H6.5a3.5 3.5 0 0 0 0 7H9',
    upload: 'M8 11V3M5 6l3-3 3 3M3 13h10',
    download: 'M8 3v8M5 8l3 3 3-3M3 13h10',
    plus: 'M8 3v10M3 8h10',
    x: 'M4 4l8 8M12 4l-8 8'
  }
</script>

<svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d={paths[name]} />
</svg>
