<script lang="ts">
	import Child from './Child.svelte';
	import JsChild from './JsChild.svelte';
	const total: number = 1;
</script>

<Child count={total} />
<JsChild label="x" />
